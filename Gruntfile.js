'use strict'

const path = require('path')

module.exports = function (grunt) {
  const spawn = require('child_process').spawn
  require('load-grunt-tasks')(grunt)
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-chmod')

  const skipNpmInstall = process.argv.includes('--cached-modules')
  const binDirectory = 'bin/'
  const moduleCacheDirectory = '.tmp/'

  grunt.initConfig({
    clean: {
      cache: moduleCacheDirectory,
      bin: binDirectory,
      osx: path.join(binDirectory, '/Orbit-darwin-x64'),
      linux: path.join(binDirectory, '/Orbit-linux-x64'),
      npm: [
        'node_modules/ipfs/node_modules/ipfs-api',
        'node_modules/ipfsd-ctl/node_modules/go-ipfs-dep',
        'node_modules/ipfsd-ctl/node_modules/ipfs-api'
      ],
      npm_build: [
        path.join(moduleCacheDirectory, 'node_modules/ipfs/node_modules/ipfs-api'),
        path.join(moduleCacheDirectory, 'node_modules/ipfsd-ctl/node_modules/go-ipfs-dep'),
        path.join(moduleCacheDirectory, 'node_modules/uport-registry/node_modules/ipfs-api'),
        path.join(moduleCacheDirectory, 'node_modules/ipfs-js/node_modules/ipfs-api'),
        path.join(moduleCacheDirectory, 'node_modules/ipfsd-ctl/node_modules/ipfs-api')
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

  grunt.registerTask('npm_install', '', function (os) {
      var done = this.async()
      var params = ['install', '--production', '--cache-min 9999999']
      let env = Object.assign({}, process.env)
      env.TARGET_OS = grunt.option('TARGET_OS')
      var npm = spawn('npm', params, { cwd: moduleCacheDirectory, env: env })
      npm.stdout.pipe(process.stdout)
      npm.stderr.pipe(process.stderr)
      npm.on('error', (err) => done(false))
      npm.on('exit', done)
  })

  grunt.registerTask('default', ["build"])
  grunt.registerTask('build', ["build_osx", "build_linux"])

  grunt.registerTask('build_osx', function() {
    if(!skipNpmInstall)
      grunt.task.run('clean:cache')

    grunt.task.run('clean:osx')
    grunt.task.run('copy:main')

    if(!skipNpmInstall) {
      grunt.task.run('npm_install')
    }

    grunt.task.run('clean:npm_build')
    grunt.task.run('chmod:bins')
    grunt.task.run('electron:osxBuild')
    grunt.task.run('clean:electron')
  })

  grunt.registerTask('build_linux', function() {
    if(!skipNpmInstall)
      grunt.task.run('clean:cache')

    grunt.task.run('clean:linux')
    grunt.task.run('copy:main')

    if(!skipNpmInstall) {
      grunt.task.run('npm_install')
    }

    grunt.task.run('clean:npm_build')
    grunt.task.run('chmod:bins')
    grunt.task.run('electron:linuxBuild')
    grunt.task.run('clean:electron')
  })

}
