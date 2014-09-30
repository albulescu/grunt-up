Grunt Deploy Task ( grunt-up )
====================

Grunt task for deploying new releases of nodejs applications


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
            privateKey: require('fs').readFileSync(process.env.HOME + '/.ssh/id_rsa')
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

Changelog
-----------

- 1.0.1
 - bug fix
- 1.0.0
 - basic functionality of deploying nodejs application



[grunt]:http://gruntjs.com/
[grunt-start]:http://gruntjs.com/getting-started
[grunt-file]:http://gruntjs.com/sample-gruntfile
