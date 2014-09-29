/**
 * grunt-release-deploy
 * https://github.com/albulescu/grunt-release-deploy
 *
 * Author Albulescu Cosmin <cosmin@albulescu.ro>
 * Licensed under the MIT license.
 */

 'use strict';

 module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    
    jshint: {
      all: [
      'Gruntfile.js',
      'tasks/*.js',
      '<%= nodeunit.tests %>',
      ],
      options: {
        jshintrc: '.jshintrc',
      },
    },

    clean: {
      tests: ['tmp'],
    },

    // Configuration to be run (and then tested).
    releasedeploy: {
      noserver: {
        options: {
          servers: [],
          execute : {
            before: [],
            after: [],
          },
          source: process.cwd() + '/dist/*',
          dest: '/usr/share/application'
        }
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['tests/*_test.js'],
    },

  });

  grunt.loadTasks('tasks');

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  grunt.registerTask('default', ['nodeunit']);
};
