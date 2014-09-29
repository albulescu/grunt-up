/**
 * grunt-release-deploy
 * https://github.com/albulescu/grunt-release-deploy
 *
 * Author Albulescu Cosmin <cosmin@albulescu.ro>
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

	grunt.registerMultiTask('releasedeploy', 'Deploy new release', function () {
		
		var async 	 = require('async'),
			ssh 	 = require('ssh2'),
			complete = this.async(),
			options  = this.options(),
			exec 	 = require('child_process').exec,
			version  = (new Date()).getTime();


		
		/**
		 * Get before and after hooks to execute after upload is made
		 * @param  {string} place is before or after
		 * @return {array}
		 */
		function hooks( place ) {

			if(!options.execute) {
				return [];
			}

			if( typeof(options.execute[place]) != 'undefined' )
			{
				var hooks = (options.execute[place] instanceof Array) ? options.execute[place] : 
												  	   [options.execute[place]];
				hooks.forEach(function(hook, index){
					if( typeof(hook) != 'string' && hook.constructor !== String ) {
						throw ('Command '+index+' from '+place+' hooks must be a string. Typeof ' + typeof(hook) + ' found.');
					}
				});	

				return hooks;							  	   
			}

			return [];
		}

		/**
		 * Upload source to machine
		 * @param  {SSH} SSH Connection
		 * @return {void}
		 */
		function upload( connection ) {

			return function( callback ) {

				grunt.log.writeln("Start uploading...");

				async.series([
					
					//make something
					command(connection, 'date')

				], function(error, results){
					grunt.log.writeln("Upload complete!");
					callback(error, results);
				});

			};
		};

		/**
		 * Create a command task
		 * @param  {SSH} SSH Connection
		 * @param  {string} ssh command to execute
		 * @return {void}
		 */
		function command( connection, command ) {

			return function( callback ) {
				
				grunt.log.debug("Execute: " + command);
				

				connection.exec( command.toString(), function( error, stream ){
					
					if( error ) {
						return grunt.log.error("Fail to execute: " + command);
					}

					stream.on('exit', function(code, signal){
						grunt.log.debug('Exit(code:'+code+', signal:'+('none'||signal)+') for: ' + command);

					});

					stream.on('close', function(){
						grunt.log.debug('Closed: ' + command);
						callback();
					});

					stream.on('data', function(data){
						grunt.log.debug('Data for "' + command +'" : ' + data);

					});

					stream.stderr.on('data', function(data){
						grunt.log.debug('Error data for "' + command +'" : ' + data);
					});


				});

			};
		};


		/**
		 * Deploy on machine function
		 * @param  {SSH} SSH Connection
		 * @param  {object} SSH Settings
		 * @return {void}
		 */
		function deployOn( connection, settings ) {

			return function( callback ) {

				connection.on('ready', function(){

					var commands = [];

					//add before deploy commands
					hooks('before').forEach(function( hook ){
						commands.push( command(connection, hook) );
					});

					commands.push( upload(connection) );
					
					//add after deploy commands
					hooks('after').forEach(function( hook ){
						commands.push( command(connection, hook) );
					});

					//execute machine commands series
					async.series(commands, function(error, results){
						
						//close connection with current machine
						connection.end();

						//move to next machine
						callback();
					});
				});

				grunt.log.writeln("Start deploying on " + settings.host + "...");

				connection.connect( settings )
			};
		}

		//keep all machines deploy jobs
		var deploys = [];

		//add machines to deploy on
		options.servers.forEach(function( settings ){
			deploys.push( deployOn( new ssh, settings ) );
		});

		exec('git describe --always --tag --abbrev=0', { cwd: process.env.PWD }, function (err, stdout, stderr) {
    		
    		if( err ) {
    			grunt.log.writeln("Deploy version is " + version);
				async.series( deploys, complete);
    		}

			version = stdout.split('\n').join('');

			grunt.log.writeln("Deploy version is " + version + " ( commit id ) taken from " + process.env.PWD);

			async.series( deploys, function(){
				
				grunt.log.writeln("Deploy complete!");

				complete();
			});
		});
		
    });
};