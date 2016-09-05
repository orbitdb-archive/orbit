'use strict'

if(process.env.ENV === 'dev') delete process.versions['electron']

const fs            = require('fs')
const path          = require('path')
const electron      = require('electron')
const app           = electron.app
const BrowserWindow = electron.BrowserWindow
const Menu          = electron.Menu
const ipcMain       = electron.ipcMain
const ipfsd         = require('ipfsd-ctl')
const Logger        = require('logplease')
const utils         = require('./src/utils')

const logger = Logger.create("Orbit.Index-Native")
// require('crash-reporter').start()
const MODE = process.env.ENV ? process.env.ENV : 'debug'

const appDataPath = path.resolve(MODE === 'dev' ? process.cwd() : process.resourcesPath + "/app")
if(!fs.existsSync(appDataPath))
  fs.mkdirSync(appDataPath)

Logger.setLogfile(path.join(appDataPath, 'debug.log'))
logger.debug("Run index.js in '" + MODE + "' mode")

const widht = 700
const height = 900
const minWidth = 650

const connectWindowSize = {
  width: widht,
  height: height,
  center: true,
  minWidth: minWidth,
  minHeight: 512,
  "web-preferences": {
    "web-security": false
  }
}

const mainWindowSize = {
  width: widht,
  height: height,
  center: true,
  minWidth: minWidth,
  minHeight: 512,
  "web-preferences": {
    "web-security": false
  }
}

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
  // events.emit('shutdown')
  setTimeout(() => {
    logger.info("All done!")
    app.quit()
  }, 1000)
}

const getUserHome = () => {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME']
}

app.on('window-all-closed', shutdown)
process.on('SIGINT', () => shutdown)
process.on('SIGTERM', () => shutdown)

app.on('ready', () => {
  try {
    logger.info("Starting the systems")

    Menu.setApplicationMenu(menu)

    mainWindow = new BrowserWindow(connectWindowSize)
    mainWindow.webContents.session.setDownloadPath(path.resolve(getUserHome() + '/Downloads'))

    global.DEV = MODE === 'dev'
    global.isElectron = true

    let ipfsDaemon
    ipfsd.local((err, node) => {
      if(err) reject(err)
      ipfsDaemon = node
      ipfsDaemon.startDaemon((err, ipfs) => {
        global.ipfsInstance = ipfs
        if(MODE === 'dev')
          mainWindow.loadURL('http://localhost:8000/')
        else
          mainWindow.loadURL('file://' + __dirname + '/client/dist/index.html')
      })
    })

    mainWindow.on('closed', () => {
      mainWindow = null
    })

    ipcMain.on('connected', (event) => {
      setWindowToNormal()
    })

    ipcMain.on('disconnected', (event) => {
      setWindowToLogin()
    })

  } catch(e) {
    logger.error("Error in index-native:", e)
  }
})
