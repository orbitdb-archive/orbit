'use strict'

if(process.env.ENV === 'dev') delete process.versions['electron']

const fs            = require('fs')
const path          = require('path')
const electron      = require('electron')
const app           = electron.app
const BrowserWindow = electron.BrowserWindow
const Menu          = electron.Menu
const ipcMain       = electron.ipcMain
const dialog        = electron.dialog
const ipfsd         = require('ipfsd-ctl')
const IpfsApi       = require('ipfs-api')
const Logger        = require('logplease')
const utils         = require('./src/utils')

const logger = Logger.create("Orbit.Index-Native")

const MODE = process.env.ENV ? process.env.ENV : 'debug'

const getUserHome = () => {
  return process.env[(process.platform !== 'win32') ? 'HOME' : 'USERPROFILE']
}

const getAppDataDirectory = () => {
  return process.platform !== 'win32'
    ? 'Library/Application Support/orbit-floodsub-ipfs-repo'
    : 'AppData\\Roaming\\orbit-floodsub-ipfs-repo'
}

const dataDirectory = path.join(getUserHome(), getAppDataDirectory())

const appDataPath = path.resolve(MODE === 'dev' ? process.cwd() : process.resourcesPath + "/app")
if (!fs.existsSync(appDataPath))
  fs.mkdirSync(appDataPath)

Logger.setLogfile(path.join(appDataPath, 'debug.log'))
logger.debug("Run index.js in '" + MODE + "' mode")

const connectWindowSize = { width: 500, height: 430, center: true, minWidth: 500, minHeight: 430, "web-preferences": {
      "web-security": false
    } }
const mainWindowSize    = { width: 1200, height: 800, center: true, minWidth: 256, minHeight: 256, "web-preferences": {
      "web-security": false
    } }
let mainWindow = null

const template = require('./menu-native')(app)
const menu = Menu.buildFromTemplate(template)
let events

const setWindowToNormal = () => {
  const pos  = mainWindow.getPosition() || [0, 0]
  const size = mainWindow.getSize() || [connectWindowSize.width, connectWindowSize.height]
  const x    = (pos[0] + size[0]/2) - mainWindowSize.width/2
  const y    = (pos[1] + size[1]/2) - mainWindowSize.height/2
  mainWindow.setSize(mainWindowSize.width, mainWindowSize.height)
  mainWindow.setPosition(x, y)
}

const setWindowToLogin = () => {
  const pos  = mainWindow.getPosition() || [0, 0]
  const size = mainWindow.getSize() || [mainWindowSize.width, mainWindowSize.height]
  const x    = (pos[0] + size[0]/2) - connectWindowSize.width/2
  const y    = (pos[1] + size[1]/2) - connectWindowSize.height/2
  mainWindow.setSize(connectWindowSize.width, connectWindowSize.height)
  mainWindow.setPosition(x, y)
}

const shutdown = () => {
  logger.info("Shutting down...")
  setTimeout(() => {
    logger.info("All done!")
    app.quit()
  }, 1000)
}

app.on('window-all-closed', shutdown)
process.on('SIGINT', () => shutdown)
process.on('SIGTERM', () => shutdown)

process.on('uncaughtException', (error) => {
  logger.warn(error)
})

app.on('ready', () => {
  try {

    mainWindow = new BrowserWindow(connectWindowSize)

    logger.info("Checking for running IPFS daemon...")
    const test = IpfsApi()
    test.version((err, v) => {
      if(v && (v.version.split('.')[1] !== '4' || v.version.split('.')[2] !== '4-dev')) {
        let errStr = ''
        errStr += "Detected a running IPFS daemon version '" + v.version + "'\n"
        errStr += "Please shut down other IPFS daemons before running Orbit\n"

        errStr.split('\n')
          .forEach((e) => logger.error(e))

        mainWindow.loadURL('file://' + __dirname + '/client/dist/error.html?message=' + encodeURIComponent(errStr))
      } else {
        logger.info("Starting the systems")

        Menu.setApplicationMenu(menu)

        mainWindow = new BrowserWindow(connectWindowSize)
        mainWindow.webContents.session.setDownloadPath(path.resolve(getUserHome() + '/Downloads'))

        global.DEV = MODE === 'dev'
        global.isElectron = true

        let opts = {}
        opts['Addresses.API'] = '/ip4/127.0.0.1/tcp/0'
        opts['Addresses.Swarm'] = ['/ip4/0.0.0.0/tcp/0']
        opts['Addresses.Gateway'] = ''

        const loadApp = () => {
          if(MODE === 'dev')
            mainWindow.loadURL('http://localhost:8000/')
          else
            mainWindow.loadURL('file://' + __dirname + '/client/dist/index.html')
        }

        if (!err) {
          global.ipfsInstance = IpfsApi()
          loadApp()
        } else {
          let ipfsDaemon
          ipfsd.local(dataDirectory, opts, (err, node) => {
            if(err) throw err
            ipfsDaemon = node

            logger.info("Initializing IPFS daemon")
            ipfsDaemon.init((err, node) => {
              // Ignore error (usually "repo already exists")
              if (err) {
                console.log(err)
                const repoExists = String(err).match('ipfs configuration file already exists')
                const migrationNeeded = String(err).match('ipfs repo needs migration')

                if(migrationNeeded) {
                  let errStr = `Error initializing IPFS daemon: '${migrationNeeded[0]}'\n`
                  errStr += `Tried to init IPFS repo at '${dataDirectory}', but failed.\n`
                  errStr += `Use $IPFS_PATH to specify another repo path, eg. 'export IPFS_PATH=/tmp/orbit-floodsub'.`

                  errStr.split('\n')
                    .forEach((e) => logger.error(e))

                  dialog.showMessageBox({
                    type: 'error',
                    buttons: ['Ok :('],
                    title: 'Error',
                    message: migrationNeeded[0],
                    detail: errStr
                  }, () => process.exit(1))
                }
              } else {
                logger.info("Starting IPFS daemon")
                ipfsDaemon.startDaemon((err, ipfs) => {
                  if (err) throw err
                  logger.info("IPFS daemon started at", ipfs.apiHost, ipfs.apiPort)
                  global.ipfsInstance = IpfsApi(ipfs.apiHost, ipfs.apiPort)
                  // global.ipfsInstance = ipfs
                  loadApp()
                })
              }
            })
          })
        }

        mainWindow.on('closed', () => {
          mainWindow = null
        })

        ipcMain.on('connected', (event) => {
          setWindowToNormal()
        })

        ipcMain.on('disconnected', (event) => {
          setWindowToLogin()
        })
      }
    })
  } catch(e) {
    logger.error("Error in index-native:", e)
  }
})
