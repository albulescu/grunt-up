Grunt Deploy Task ( grunt-up )
====================

Grunt task for deploying new releases


Installation
-----------
If you haven't used [Grunt][grunt] before, be sure to check out the [Getting Started][grunt-start] guide, as it explains how to create a [Gruntfile][grunt-file] as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```sh
npm install grunt-up --save-dev
```
After package installed you need to load task by adding this link in your grunt file
```sh
grunt.loadNpmTasks('grunt-up');
```
How to use
-----------
Add new key in your grunt file on grunt.initConfig.
```sh
up: {
    live: {
        options: {
          servers: [{
            host: 'example.com',
            username: 'root',
            password:'password',//not required if privateKey is present
            privateKey: process.env.HOME + '/.ssh/id_rsa'
          }],
          execute : {
            before: [], //list of commands or just a string with sh command
            after: [],
          },
          source: process.cwd() + '/dist/*',
          dest: '/var/www/app'
        }
    }
},
```

Create task for deploying yout application versioned. This will increment version from your package.json file and will create and commit a tag with version to git. [Grunt shell][grunt-shell] is required for this. Install it with ```npm install grunt-shell```

Execute task with: ```$ grunt deploy:major``` or ``` $ grunt deploy:minor ```

```sh
...
shell: {
  versionminor: {command: 'npm version minor'},
  versionmajor: {command: 'npm version major'},
  versionpatch: {command: 'npm version patch'},
},

up: {
  live: {
    options: {
      servers: [{
        host: 'albulescu.ro',
        username: 'root',
        privateKey: require('fs').readFileSync(process.env.HOME + '/.ssh/id_rsa')
      }],
      execute : {
        before: ['echo @version'],
        after: ['cd @path && pwd'],
      },
      source: process.cwd() + '/dist/*',
      dest: '/usr/share/wallsongs'
    }
  }
},
...
...
grunt.registerTask('deploy', function( mode ){

    if(!mode) {
      return grunt.fail.warn('Specify release type "minor", "major" or "patch".');
    }

    if( mode == 'major') {
      return grunt.task.run([
          'shell::versionmajor',
          'build',
          'up:live',
      ]);
    }

    if( mode == 'minor' ) {
      return grunt.task.run([
          'shell::versionminor',
          'build',
          'up:live',
      ]);
    }

    if( mode == 'patch' ) {
      return grunt.task.run([
          'shell::versionpatch',
          'build',
          'up:live',
      ]);
    }

    grunt.fail.warn('Invalid release type "minor", "major" or "patch" required.');

  });

```

Changelog
-----------
- 1.0.2
 - Add placeholder support for hook commands
- 1.0.1 
 - Bug fix
- 1.0.0
 - basic functionality of deploying nodejs application


[grunt]:http://gruntjs.com/
[grunt-start]:http://gruntjs.com/getting-started
[grunt-file]:http://gruntjs.com/sample-gruntfile
[grunt-shell]:https://github.com/sindresorhus/grunt-shell
