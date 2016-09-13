'use strict'

const path = require('path')

module.exports = function (grunt) {
  const spawn = require('child_process').spawn
  require('load-grunt-tasks')(grunt)
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-chmod')

  const skipNpmInstall = process.argv[3] === '--cached-modules'
  const binDirectory = 'bin/'
  const moduleCacheDirectory = '.tmp/'

  grunt.initConfig({
    clean: {
      cache: moduleCacheDirectory,
      bin: binDirectory,
      npm: [
        'node_modules/ipfs/node_modules/ipfs-api@0.4.1',
        'node_modules/ipfsd-ctl/node_modules/go-ipfs-dep',
        'node_modules/ipfsd-ctl/node_modules/ipfs-api'
      ],
      electron: [
        'Orbit-darwin-x64/',
        'Orbit-linux-x64/'
      ]
    },

    electron: {
      osxBuild: {
        options: {
          name: 'Orbit',
          dir: moduleCacheDirectory,
          out: binDirectory,
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
          dir: moduleCacheDirectory,
          out: binDirectory,
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
              "./client/dist/**",
              "package.json",
              "!./Gruntfile.js"
            ],
            dest: moduleCacheDirectory
          }
        ]
      },
      ipfsbin: {
        files: [
          {
            expand: true,
            src: './node_modules/go-ipfs-dep/go-ipfs/ipfs',
            dest: path.join(moduleCacheDirectory, 'node_modules/go-ipfs-dep/go-ipfs/ipfs')
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
          path.join(moduleCacheDirectory, 'node_modules/subcomandante/subcom'),
          path.join(moduleCacheDirectory, 'node_modules/go-ipfs-dep/go-ipfs/ipfs'),
        ]
      }
    },
  })

  grunt.registerTask('npm_install', '', function () {
      var done = this.async()
      var params = ['install', '--production', '--cache-min 9999999']
      var npm = spawn('npm', params, { cwd: moduleCacheDirectory })
      npm.stdout.pipe(process.stdout)
      npm.stderr.pipe(process.stderr)
      npm.on('error', (err) => done(false))
      npm.on('exit', done)
  })

  grunt.registerTask('default', ["build"])
  grunt.registerTask('build', ["build_osx"])

  grunt.registerTask('build_osx', function() {
    grunt.task.run('clean:bin')
    grunt.task.run('copy_files')

    if(!skipNpmInstall) {
      grunt.task.run('npm_install')
      grunt.task.run('copy:ipfsbin')
    }

    grunt.task.run('chmod:bins')
    grunt.task.run('electron:osxBuild')
    grunt.task.run('clean:electron')
  })

  grunt.registerTask('build_linux', function() {
    grunt.task.run('clean:bin')
    grunt.task.run('copy_files')

    if(!skipNpmInstall) {
      grunt.task.run('npm_install')
      grunt.task.run('copy:ipfsbin')
    }

    grunt.task.run('chmod:bins')
    grunt.task.run('electron:linuxBuild')
    grunt.task.run('clean:electron')
  })

  grunt.registerTask('copy_files', function() {
    if(!skipNpmInstall)
      grunt.task.run('clean:cache')

    grunt.task.run('copy:main')
  })
}
