/**
 * grunt-release-deploy
 * https://github.com/albulescu/grunt-up
 *
 * Author Albulescu Cosmin <cosmin@albulescu.ro>
 * Licensed under the MIT license.
 */

'use strict';

var grunt = require('grunt');


exports.deploy = {
  setUp: function(done) {
    done();
  },
  no_servers: function(test) {
    grunt.util.spawn({
      grunt: true,
      args: ['up:noserver', '--no-color'],
    }, function(err, result) {
      test.ok(result.stdout.indexOf("No servers to deploy!") !== -1, 'Shoud throw error due no servers');
      test.done();
    });
  },
};
