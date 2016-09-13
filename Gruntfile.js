'use strict';

const ElectronVersion = '1.3.1'

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-chmod');

  const spawn = require('child_process').spawn;

  grunt.initConfig({
    clean: {
      cache: [".tmp"],
      dist: ["dist"],
      osx: ["dist/Orbit-darwin-x64"],
      linux: ["dist/Orbit-linux-x64"],
      npm: [
        'node_modules/ipfs/node_modules/ipfs-api',
        'node_modules/ipfsd-ctl/node_modules/ipfs-api'
      ]
    },

    electron: {
      osxBuild: {
        options: {
          name: 'Orbit',
          dir: '.tmp',
          out: 'dist/',
          version: ElectronVersion,
          platform: 'darwin',
          arch: 'x64',
          overwrite: true,
          icon: 'assets/orbit.icns',
          download: {
            cache: '.electron-prebuilt'
          }
        }
      },
      linuxBuild: {
        options: {
          name: 'Orbit',
          dir: '.tmp',
          out: 'dist/',
          version: ElectronVersion,
          platform: 'linux',
          arch: 'x64',
          overwrite: true,
          icon: 'assets/orbit.icns',
          download: {
            cache: '.electron-prebuilt'
          }
        }
      }
    },

    copy: {
      main: {
        files: [
          {
            expand: true,
            src: [
              "./*.js",
              "src/**",
              "keys/**",
              "./client/dist/**",
              "package.json",
              "network.json",
              "!./Gruntfile.js"
            ],
            dest: '.tmp/'
          }
        ]
      }
    },

    chmod: {
      bins: {
        options: {
          mode: '755'
        },
        src: [
          '.tmp/node_modules/**',
          'dist/Orbit-darwin-x64/Orbit.app/Contents/Resources/app/node_modules/subcomandante/subcom',
          'dist/Orbit-darwin-x64/Orbit.app/Contents/Resources/app/node_modules/go-ipfs-dep/go-ipfs/ipfs',
          'dist/Orbit-linux-x64/Orbit.app/Contents/Resources/app/node_modules/subcomandante/subcom',
          'dist/Orbit-linux-x64/Orbit.app/Contents/Resources/app/node_modules/go-ipfs-dep/go-ipfs/ipfs'
        ]
      }
    },
  });

  grunt.registerTask('npm_install', '', function () {
      var done = this.async();
      var params = ['install', '--production', '--cache-min 9999999'];
      var npm = spawn('npm', params, { cwd: '.tmp' });
      npm.stdout.pipe(process.stdout);
      npm.stderr.pipe(process.stderr);
      npm.on('error', (err) => done(false));
      npm.on('exit', done);
  });

  grunt.registerTask('default', ["build"]);
  grunt.registerTask('build_osx', ["build_osx"]);
  grunt.registerTask('build_linux', ["build_linux"]);

  grunt.registerTask('build', function() {
    grunt.task.run('clean:osx');
    grunt.task.run('clean:linux');
    grunt.task.run('copy_files');
    grunt.task.run('npm_install');
    grunt.task.run('electron:osxBuild');
    grunt.task.run('chmod:bins');
  });

  grunt.registerTask('build_osx', function() {
    grunt.task.run('clean:osx');
    grunt.task.run('copy_files');
    grunt.task.run('npm_install');
    grunt.task.run('electron:osxBuild');
    grunt.task.run('chmod:bins');
  });

  grunt.registerTask('build_linux', function() {
    grunt.task.run('clean:linux');
    grunt.task.run('copy_files');
    grunt.task.run('npm_install');
    grunt.task.run('electron:linuxBuild');
    grunt.task.run('chmod:bins');
  });

  grunt.registerTask('copy_files', function() {
    grunt.task.run('clean:cache');
    grunt.task.run('copy:main');
  });

};
