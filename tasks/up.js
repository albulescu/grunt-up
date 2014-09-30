/**
 * grunt-release-deploy
 * https://github.com/albulescu/grunt-release-deploy
 *
 * Author Albulescu Cosmin <cosmin@albulescu.ro>
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

	grunt.registerMultiTask('up', 'Deploy new release', function() {

		var async = require('async'),
		    SSH = require('ssh2'),
		    complete = this.async(),
		    options = this.options(),
		    util = require('util'),
		    exec = require('child_process').exec,
		    version = (new Date()).getTime();

		/**
		 * Get before and after hooks to execute after upload is made
		 * @param  {string} place is before or after
		 * @return {array}
		 */
		function hooks(place) {

			if (!options.execute) {
				return [];
			}

			if (typeof(options.execute[place]) !== 'undefined') {
				var list = (options.execute[place] instanceof Array) ? options.execute[place] :
					[options.execute[place]];
				list.forEach(function(hook, index) {
					if (typeof(hook) !== 'string' && hook.constructor !== String) {
						throw ('Command ' + index + ' from ' + place + ' hooks must be a string. Typeof ' + typeof(hook) + ' found.');
					}
				});

				return list;
			}

			return [];
		}

		/**
		 * Upload source to machine
		 * @param {SSH} SSH Connection
		 * @param {object} SSH Settings
		 * @return {void}
		 */
		function upload(connection, settings) {

			return function(callback) {

				grunt.log.writeln("Start uploading...");

				async.series([

					//create release version directory
					command(connection, 'cd %s/releases && mkdir %s', options.dest, version),

					//remove current link to the last release
					command(connection, 'rm -rf %s/current', options.dest),

					//create symbolic link
					command(connection, 'ln -s %s/releases/%s %s/current', options.dest, version, options.dest),

					//copy source to remote destination
					command('scp -r %s %s@%s:%s/releases/%s', options.source, settings.username, settings.host, options.dest, version)

				], function(error, results) {
					grunt.log.writeln("Upload complete!");
					callback(error, results);
				});

			};
		}

		/**
		 * Create a command task
		 * @param  {SSH} SSH Connection ( Avoid this to execute command locally )
		 * @param  {string} ssh command to execute
		 * @return {void}
		 */
		function command(connection, cmd) {

			var args = Array.prototype.slice.call(arguments, 0);
			var locally = false;

			if (typeof(connection) === 'object') {
				if (arguments.length > 2) {
					args = args.slice(2, args.length);
					args.unshift(cmd);
					cmd = util.format.apply(null, args);
				}
			} else if (typeof(connection) === 'string') {
				locally = true;
				cmd = connection;
				if (arguments.length > 1) {
					args = args.slice(1, args.length);
					args.unshift(cmd);
					cmd = util.format.apply(null, args);
				}
			}

			return function(callback) {

				grunt.log.debug("Execute: " + cmd);

				if( locally )
				{
					return exec(cmd.toString(), function (error, stdout, stderr) {
						
						if( error ) {
							return grunt.fail.warn("Fail to execute locally: " + cmd);
						}

						if( stderr ) {
							return grunt.fail.warn(stderr);
						}

						grunt.log.debug('Locally exec result of "'+cmd+'": ' + stdout);

						callback();
					});
				}

				
				connection.exec(cmd.toString(), function(error, stream) {

					if (error) {
						return grunt.log.error("Fail to execute: " + cmd);
					}

					stream.on('exit', function(code, signal) {
						grunt.log.debug('Exit(code:' + code + ', signal:' + ('none' || signal) + ') for: ' + cmd);

					});

					stream.on('close', function() {
						grunt.log.debug('Closed: ' + cmd);
						callback();
					});

					stream.on('data', function(data) {
						grunt.log.debug('Data for "' + cmd + '" : ' + data);

					});

					stream.stderr.on('data', function(data) {
						grunt.log.debug('Error data for "' + cmd + '" : ' + data);
					});


				});

			};
		}


		/**
		 * Deploy on machine function
		 * @param  {SSH} SSH Connection
		 * @param  {object} SSH Settings
		 * @return {void}
		 */
		function deployOn(connection, settings) {

			return function(callback) {

				connection.on('ready', function() {

					var commands = [];

					//add before deploy commands
					hooks('before').forEach(function(hook) {
						commands.push(command(connection, hook));
					});

					commands.push(upload(connection, settings));

					//add after deploy commands
					hooks('after').forEach(function(hook) {
						commands.push(command(connection, hook));
					});

					//execute machine commands series
					async.series(commands, function(error, results) {

						//close connection with current machine
						connection.end();

						//move to next machine
						callback();
					});
				});

				grunt.log.writeln("Start deploying on " + settings.host + "...");

				connection.connect(settings);
			};
		}

		if( typeof(options.servers) === 'undefined' || options.servers.length == 0) {
			return grunt.fail.fatal("No servers to deploy!");
		}

		//keep all machines deploy jobs
		var deploys = [];

		//add machines to deploy on
		options.servers.forEach(function(settings) {
			deploys.push(deployOn(new SSH(), settings));
		});

		exec('git describe --always --tag --abbrev=0', {
			cwd: process.env.PWD
		}, function(err, stdout, stderr) {

			if (err) {
				grunt.log.writeln("Deploy version is " + version);
				async.series(deploys, complete);
			}

			version = stdout.split('\n').join('');

			grunt.log.writeln("Deploy version is " + version + " ( commit id ) taken from " + process.env.PWD);

			async.series(deploys, function() {

				grunt.log.writeln("Deploy complete!");

				complete();
			});
		});

	});
};
