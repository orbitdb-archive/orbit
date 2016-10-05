'use strict'

if(process.env.ENV === 'dev') delete process.versions['electron']

const electron      = require('electron')
const app           = electron.app
const BrowserWindow = electron.BrowserWindow
const Menu          = electron.Menu
const ipcMain       = electron.ipcMain
const dialog        = electron.dialog
const fs            = require('fs')
const path          = require('path')
const ipfsd         = require('ipfsd-ctl')
const IpfsApi       = require('ipfs-api')
const Logger        = require('logplease')
// const Orbit         = require('./src/Orbit')

 // dev|debug
const MODE = process.env.ENV ? process.env.ENV : 'debug'

const logger = Logger.create("Orbit.Index-Native")

// Get data directories
const userHomeDir = app.getPath("home")
const userDownloadDir = app.getPath("downloads")
const appDataDir = app.getPath("userData")

const ipfsDataDir = process.env.IPFS_PATH
  ? path.resolve(process.env.IPFS_PATH)
  : path.join(appDataDir, '/ipfs')

const orbitDataDir = (MODE === 'dev')
  ? path.join(process.cwd() , '/data') // put orbit's data to './data' in dev mode
  : path.join(appDataDir, '/orbit-data')

// Make sure we have the Orbit data directory
if (!fs.existsSync(appDataDir))
  fs.mkdirSync(appDataDir)
if (!fs.existsSync(orbitDataDir))
  fs.mkdirSync(orbitDataDir)

Logger.setLogfile(path.join(orbitDataDir, '/debug.log'))
Logger.setLogLevel('DEBUG')

const connectWindowSize = {
  width: 512,
  height: 512,
  center: true,
  resize: false,
  "web-preferences": {
    "web-security": false,
    zoomFactor: 3.0
  }
}

const mainWindowSize = {
  width: 1200,
  height: 800,
}

// Menu bar
const template = require('./menu-native')(app)
const menu = Menu.buildFromTemplate(template)

// Handle shutdown gracefully
const shutdown = () => {
  logger.info("Shutting down...")
  setTimeout(() => {
    logger.info("All done!")
    app.quit()
    process.exit(0)
  }, 1000)
}

app.on('window-all-closed', shutdown)
process.on('SIGINT', () => shutdown)
process.on('SIGTERM', () => shutdown)

// Log errors
process.on('uncaughtException', (error) => {
  // Skip 'ctrl-c' error and shutdown gracefully
  const match = String(error).match(/non-zero exit code 255/)
  if(match)
    shutdown()
  else
    logger.error(error)
})

// Window handling
let mainWindow
const setWindowToNormal = () => {
  mainWindow.setSize(mainWindowSize.width, mainWindowSize.height)
  mainWindow.setResizable(true)
  mainWindow.center()
}

const setWindowToLogin = () => {
  mainWindow.setSize(connectWindowSize.width, connectWindowSize.height)
  mainWindow.setResizable(false)
  mainWindow.center()
}

logger.debug("Run index.js in '" + MODE + "' mode")

// Start
app.on('ready', () => {
  try {
    mainWindow = new BrowserWindow(connectWindowSize)
    mainWindow.webContents.session.setDownloadPath(path.resolve(userDownloadDir))
    Menu.setApplicationMenu(menu)

    global.DEV = MODE === 'dev'
    global.isElectron = true

    // Display a loading screen while we boot up
    mainWindow.loadURL('file://' + __dirname + '/client/dist/loading.html')

    // Bind the Orbit IPFS daemon to a random port
    let opts = {}
    opts['Addresses.API'] = '/ip4/127.0.0.1/tcp/0'
    opts['Addresses.Swarm'] = ['/ip4/0.0.0.0/tcp/0']
    opts['Addresses.Gateway'] = '/ip4/0.0.0.0/tcp/0'

    let ipfsDaemon
    ipfsd.local(ipfsDataDir, opts, (err, node) => {
      if(err) throw err
      ipfsDaemon = node

      logger.info("Initializing IPFS daemon")
      logger.debug(`Using IPFS repo at '${node.path}'`)

      ipfsDaemon.init({ directory: ipfsDataDir }, (err, node) => {
        // Ignore error (usually "repo already exists")
        if (!err) {
          logger.info("Starting IPFS daemon")
          ipfsDaemon.startDaemon(['--enable-pubsub-experiment'], (err, ipfs) => {
            if (err) throw err

            global.ipfsInstance = IpfsApi(ipfs.apiHost, ipfs.apiPort)
            global.gatewayAddress = node.gatewayAddr ? node.gatewayAddr + '/ipfs/' : 'localhost:8080/ipfs/'
            // global.orbit = new Orbit(ipfsInstance, { dataPath: orbitDataDir })

            logger.info("IPFS daemon started at", ipfs.apiHost, ipfs.apiPort)
            logger.info("Gateway at", global.gatewayAddress)

            // Load the dist build or connect to webpack-dev-server
            const indexUrl = MODE === 'dev'
              ? 'http://localhost:8000/'
              : 'file://' + __dirname + '/client/dist/index.html'

            mainWindow.loadURL(indexUrl)
          })
        } else {
          // Check if the Orbit IPFS repo is an incompatible one
          const migrationNeeded = String(err).match('ipfs repo needs migration')

          if (migrationNeeded) {
            let errStr = `Error initializing IPFS daemon: '${migrationNeeded[0]}'\n`
            errStr += `Tried to init IPFS repo at '${ipfsDataDir}', but failed.\n`
            errStr += `Use $IPFS_PATH to specify another repo path, eg. 'export IPFS_PATH=/tmp/orbit-floodsub'.`

            errStr.split('\n')
              .forEach((e) => logger.error(e))

            dialog.showMessageBox({
              type: 'error',
              buttons: ['Ok'],
              title: 'Error',
              message: migrationNeeded[0],
              detail: errStr
            }, () => process.exit(1))
          }
        }
      })
    })

    // Resize the window as per app state
    ipcMain.on('connected', (event) => setWindowToNormal())
    ipcMain.on('disconnected', (event) => setWindowToLogin())

    // If the window is closed, assume we quit
    mainWindow.on('closed', () => {
      mainWindow = null
      ipfsDaemon.stopDaemon()
    })

  } catch(e) {
    logger.error("Error in index-native:", e)
  }
})
