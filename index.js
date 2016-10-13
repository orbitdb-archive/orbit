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
const Logger        = require('logplease')
const IpfsDaemon    = require('ipfs-daemon')

 // dev|debug
const MODE = process.env.ENV ? process.env.ENV : 'debug'

// TODO: move directory setup to its own file

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

// Set IPFS daemon's paths and addresses, and CORS
const daemonSettings = {
  AppDataDir: orbitDataDir,
  IpfsDataDir: ipfsDataDir,
  Addresses: {
    API: '/ip4/127.0.0.1/tcp/0',
    Swarm: ['/ip4/0.0.0.0/tcp/0'],
    Gateway: '/ip4/0.0.0.0/tcp/0'
  },
  API: {
    HTTPHeaders: {
      "Access-Control-Allow-Origin": ['*'],
      "Access-Control-Allow-Methods": ["PUT", "GET", "POST"],
      "Access-Control-Allow-Credentials": ["true"]
    } 
  }
}

// Setup logging
const logger = Logger.create("Orbit.Index-Native")
Logger.setLogfile(path.join(orbitDataDir, '/debug.log'))
Logger.setLogLevel('DEBUG')

// Default window settings
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


// Start
logger.debug("Run index.js in '" + MODE + "' mode")

app.on('ready', () => {
  try {
    mainWindow = new BrowserWindow(connectWindowSize)
    mainWindow.webContents.session.setDownloadPath(path.resolve(userDownloadDir))
    Menu.setApplicationMenu(menu)

    // Pass the mode and electron flag to the html (renderer process)
    global.DEV = MODE === 'dev'
    global.isElectron = true

    // Resize the window as per app state
    ipcMain.on('connected', (event) => setWindowToNormal())
    ipcMain.on('disconnected', (event) => setWindowToLogin())

    // Load and display a loading screen while we boot up
    mainWindow.loadURL('file://' + __dirname + '/client/dist/loading.html')

    // Bind the Orbit IPFS daemon to a random port, set CORS
    IpfsDaemon(daemonSettings)
      .then((res) => {
        // We have a running IPFS daemon
        const ipfsDaemon = res.daemon
        const gatewayAddr = res.Addresses.Gateway

        // Pass the ipfs (api) instance and gateway address to the renderer process
        global.ipfsInstance = res.ipfs
        global.gatewayAddress = gatewayAddr ? gatewayAddr : 'localhost:8080/ipfs/'

        // If the window is closed, assume we quit
        mainWindow.on('closed', () => {
          mainWindow = null
          ipfsDaemon.stopDaemon()
        })

        // Load the dist build or connect to webpack-dev-server
        const indexUrl = MODE === 'dev'
          ? 'http://localhost:8000/'
          : 'file://' + __dirname + '/client/dist/index.html'

        mainWindow.loadURL(indexUrl)
      })
      .catch((err) => {
        logger.error(err)
        dialog.showMessageBox({
          type: 'error',
          buttons: ['Ok'],
          title: 'Error',
          message: err.message,
          detail: err.stack
        }, () => process.exit(1))
      })
  } catch(e) {
    logger.error("Error in index-native:", e)
  }
})
