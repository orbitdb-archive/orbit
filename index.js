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
const WindowConfig  = require('./config/window.config')
const OrbitConfig   = require('./config/orbit.config')(app)

// Hack to fix "error: too open files" in go-ipfs 0.4.5-pre1
process.env.IPFS_FD_MAX = 4096

// dev|debug
const MODE = OrbitConfig.MODE

// Setup logging, to turn on the logging, run orbit-electron with LOG=debug
Logger.setLogfile(OrbitConfig.logFilePath)
let logger = Logger.create("orbit-electron", { color: Logger.Colors.Yellow })

// Menu bar
const template = require('./menu-native')(app)
const menu = Menu.buildFromTemplate(template)

// IPFS instance
let ipfs

// The application window
let mainWindow

const stopIpfs = () => {
  if (ipfs) {
    // TODO: use promises when available from ipfs-daemon
    // ipfs.stop().then(() => ipfs = nul)
    ipfs.stop()
    ipfs = null
  }
}

// Handle shutdown gracefully
const shutdown = () => {
  logger.debug("Closing...")
  mainWindow = null
  stopIpfs()
  setTimeout(() => {
    logger.debug("All done!\n")
    app.exit(0)
    process.exit(0)
  }, 1000)
}

app.on('window-all-closed', shutdown)
app.on('will-quit', (e) => {
  e.preventDefault()
  shutdown()
})
process.on('SIGINT', () => shutdown())
process.on('SIGTERM', () => shutdown())

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

const logToRenderer = (source, level, text) => {
  if (mainWindow)
    mainWindow.webContents.send('log', source, level, text)
}

// Start
logger.debug("Run index.js in '" + MODE + "' mode")

app.on('ready', () => {
  try {
    mainWindow = new BrowserWindow(connectWindowSize)
    mainWindow.webContents.session.setDownloadPath(OrbitConfig.userDownloadPath)
    Menu.setApplicationMenu(menu)

    // Pass log messages to the renderer process
    Logger.events.on('data', logToRenderer)

    // Pass the mode and electron flag to the html (renderer process)
    global.DEV = MODE === 'dev'
    global.isElectron = true
    global.orbitDataDir = OrbitConfig.orbitDataDir
    global.ipfsDataDir = OrbitConfig.ipfsDataDir

    // Load the dist build or connect to webpack-dev-server
    const indexUrl = MODE === 'dev'
      ? 'http://localhost:8000/'
      : 'file://' + __dirname + '/client/dist/index.html'

    mainWindow.loadURL(indexUrl)

    // Resize the window as per app state
    ipcMain.on('connected', (event) => setWindowToNormal())
    ipcMain.on('disconnected', (event) => {
      logger.debug("Received 'disconnected' event from renderer process")
      stopIpfs()
      setWindowToLogin()
    })

    // Handle stop daemon event from the renderer process
    ipcMain.on('ipfs-daemon-stop', () => {
      logger.debug("Received 'ipfs-daemon-stop' event from renderer process")
      stopIpfs()
    })

    // Handle start daemon event from the renderer process
    ipcMain.on('ipfs-daemon-start', (event, ipfsDaemonSettings) => {
      logger.debug("Received 'ipfs-daemon-start' event from renderer process")
      // Make sure we stop a running daemon if any
      stopIpfs()

      // Create IPFS instance
      ipfs = new IpfsDaemon(ipfsDaemonSettings)
      
      // We have a running IPFS daemon      
      ipfs.on('ready', () => {
        // Pass the ipfs (api) instance and gateway address to the renderer process
        global.ipfsInstance = ipfs
        global.gatewayAddress = ipfs.GatewayAddress
        mainWindow.webContents.send('ipfs-daemon-instance')
      })

      // Handle errors
      ipfs.on('error', (err) => {
        logger.error(err)
        mainWindow.webContents.send('error', err)
        dialog.showMessageBox({
          type: 'error',
          buttons: ['Ok'],
          title: 'Error',
          message: err.message,
        }, () => process.exit(1))
      })
    })
  } catch(e) {
    logger.error("Error:", e)
  }
})
