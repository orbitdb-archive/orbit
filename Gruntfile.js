'use strict';

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-chmod');
  grunt.loadNpmTasks('grunt-run');

  grunt.initConfig({
    clean: {
      cache: [".tmp"],
      dist: ["dist"],
      dist_nodejs_linux: ["dist/nodejs-linux"],
      dist_nodejs_osx: ["dist/nodejs-osx"],
      dist_native_osx: ["dist/Orbit-darwin-x64"],
      dist_native_linux: ["dist/Orbit-linux-x64"]
    },

    electron: {
      osxBuild: {
        options: {
          name: 'Orbit',
          dir: '.tmp',
          out: 'dist/',
          version: '0.34.1',
          platform: 'darwin',
          arch: 'x64',
          overwrite: true,
          icon: 'assets/orbit.icns',
          cache: '.electron-prebuilt'
        }
      },
      linuxBuild: {
        options: {
          name: 'Orbit',
          dir: '.tmp',
          out: 'dist/',
          version: '0.34.1',
          platform: 'linux',
          arch: 'x64',
          overwrite: true,
          icon: 'assets/orbit.icns',
          cache: '.electron-prebuilt'
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
        ],
      },
      nodejs_linux: {
        files: [
          {
            expand: true,
            cwd: '.tmp/',
            src: ["**/*", "**/.*/*"],
            dest: 'dist/nodejs-linux'
          }
        ]
      },
      nodejs_osx: {
        files: [
          {
            expand: true,
            cwd: '.tmp/',
            src: ["**/*", "**/.*/*"],
            dest: 'dist/nodejs-osx'
          }
        ]
      },
    },

    chmod: {
      bins: {
        options: {
          mode: '755'
        },
        src: [
          '.tmp/node_modules/**',
          'dist/nodejs-osx/node_modules/orbit-common/node_modules/subcomandante/subcom',
          'dist/nodejs-linux/node_modules/orbit-common/node_modules/subcomandante/subcom',
          'dist/nodejs-osx/node_modules/orbit-common/node_modules/go-ipfs-dep/go-ipfs/ipfs',
          'dist/nodejs-linux/node_modules/orbit-common/node_modules/go-ipfs-dep/go-ipfs/ipfs',
          'dist/Orbit-darwin-x64/Orbit.app/Contents/Resources/app/node_modules/subcomandante/subcom',
          'dist/Orbit-darwin-x64/Orbit.app/Contents/Resources/app/node_modules/go-ipfs-dep/go-ipfs/ipfs',
          'dist/Orbit-linux-x64/Orbit.app/Contents/Resources/app/node_modules/subcomandante/subcom',
          'dist/Orbit-linux-x64/Orbit.app/Contents/Resources/app/node_modules/go-ipfs-dep/go-ipfs/ipfs'
        ]
      }
    },

    run: {
      npm_install: {
        options: {
          cwd: ".tmp"
        },
        cmd: 'npm3',
        args: [
          'install',
          '--cache-min 9999999',
          '--production'
        ]
      },
    }

  });

  grunt.registerTask('default', ["build"]);
  grunt.registerTask('build_osx', ["build_nodejs_linux", "build_nodejs_osx", "build_native_osx"]);
  grunt.registerTask('build_linux', ["build_nodejs_linux", "build_native_linux"]);
  grunt.registerTask('build_nodejs', ["build_nodejs_linux", 'build_nodejs_osx']);

  grunt.registerTask('build', function() {
    grunt.task.run('clean:dist_nodejs_osx');
    grunt.task.run('clean:dist_nodejs_linux');
    grunt.task.run('clean:dist_native_osx');
    grunt.task.run('clean:dist_native_linux');

    grunt.task.run('copy_files');
    grunt.task.run('copy:nodejs_osx');
    grunt.task.run('copy:nodejs_linux');

    grunt.task.run('run:npm_install');
    grunt.task.run('electron:osxBuild');
    grunt.task.run('chmod:bins');
  });

  grunt.registerTask('build_nodejs_osx', function() {
    grunt.task.run('clean:dist_nodejs_osx');
    grunt.task.run('copy_files');
    grunt.task.run('copy:nodejs_osx');
    grunt.task.run('chmod:bins');
  });

  grunt.registerTask('build_nodejs_linux', function() {
    grunt.task.run('clean:dist_nodejs_linux');
    grunt.task.run('copy_files');
    grunt.task.run('copy:nodejs_linux');
    grunt.task.run('chmod:bins');
  });

  grunt.registerTask('build_native_osx', function() {
    grunt.task.run('clean:dist_native_osx');
    grunt.task.run('copy_files');
    grunt.task.run('run:npm_install');
    grunt.task.run('electron:osxBuild');
    grunt.task.run('chmod:bins');
  });

  grunt.registerTask('build_native_linux', function() {
    grunt.task.run('clean:dist_native_linux');
    grunt.task.run('copy_files');
    grunt.task.run('run:npm_install');
    grunt.task.run('electron:linuxBuild');
    grunt.task.run('chmod:bins');
  });

  grunt.registerTask('copy_files', function() {
    grunt.task.run('clean:cache');
    grunt.task.run('copy:main');
  });

};
