'use strict'

if(process.env.ENV === 'dev') delete process.versions['electron']

const electron          = require('electron')
const app               = electron.app
const BrowserWindow     = electron.BrowserWindow
const Menu              = electron.Menu
const ipcMain           = electron.ipcMain
const dialog            = electron.dialog
const fs                = require('fs')
const path              = require('path')
const Logger            = require('logplease')
const IpfsDaemon        = require('ipfs-daemon');

const WindowConfig      = require('./config/window.config')
const OrbitConfig       = require('./config/orbit.config')(app)


 // dev|debug
const MODE = OrbitConfig.MODE

Logger.setLogfile(OrbitConfig.logFilePath)
Logger.setLogLevel('DEBUG')
const logger = Logger.create("Orbit.Index-Native")

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
const connectWindowSize = WindowConfig.connectWindowSize
const mainWindowSize = WindowConfig.mainWindowSize

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
    mainWindow.webContents.session.setDownloadPath(OrbitConfig.userDownloadPath)
    Menu.setApplicationMenu(menu)

    // Pass the mode and electron flag to the html (renderer process)
    global.DEV = MODE === 'dev'
    global.isElectron = true
    global.ipfsDataDir = OrbitConfig.ipfsDataDir

    // Load the dist build or connect to webpack-dev-server
    const indexUrl = MODE === 'dev'
      ? 'http://localhost:8000/'
      : 'file://' + __dirname + '/client/dist/index.html'

    mainWindow.loadURL(indexUrl)

    logger.info("started")
    // Resize the window as per app state
    ipcMain.on('connected', (event) => setWindowToNormal())
    ipcMain.on('disconnected', (event) => setWindowToLogin())

    let ipfsDaemon = null
    mainWindow.once('closed', () => {
      ipfsDaemon = stopIpfs(ipfsDaemon)
      mainWindow = null
    })
    ipcMain.on('ipfs-daemon-stop', () => {
      ipfsDaemon = stopIpfs(ipfsDaemon)
    })
    ipcMain.on('ipfs-daemon-start', (event, ipfsDaemonSettings) => {
      logger.debug("using config", ipfsDaemonSettings)
      createIfAbsent(ipfsDaemonSettings.IpfsDataDir)
      // Bind the Orbit IPFS daemon to a random port, set CORS
      IpfsDaemon(ipfsDaemonSettings)
        .then((res) => {
          // We have a running IPFS daemon
          ipfsDaemon = res.daemon
          const gatewayAddr = res.Addresses.Gateway
          logger.info("IPFS instance runnin")
          // // Pass the ipfs (api) instance and gateway address to the renderer process
          global.ipfsInstance = res.ipfs
          // global.gatewayAddress = gatewayAddr ? gatewayAddr : 'localhost:8080/ipfs/'
          logger.debug("Send 'ipfs-daemon-instance' signal ")
          mainWindow.webContents.send('ipfs-daemon-instance')
          // If the window is closed, assume we quit
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
    })

  } catch(e) {
    logger.error("Error in index-native:", e)
  }
})

function stopIpfs(ipfsDaemon) {
  if (ipfsDaemon) {
    ipfsDaemon.stopDaemon()
    logger.info("IPFS instance stopped")
    return null
  }
  return ipfsDaemon
}

function createIfAbsent(path) {
  logger.debug("Check [" + path + "] exists")
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path)
    logger.debug("Create [" + path + "]")
  }
}
