'use strict';

if(process.env.ENV === 'dev') delete process.versions['electron'];

const electron = require('electron');
const app    = electron.app;
const Window = electron.BrowserWindow;
const Menu   = electron.Menu;
const path   = require('path');
const Logger = require('logplease');
const logger = Logger.create("Orbit.Index-Native");
// const main   = require('./src/main');
const IPFSAPI      = require('ipfs-api')

// require('crash-reporter').start();

Logger.setLogfile(path.resolve(process.env.ENV === 'dev' ? process.cwd() : process.resourcesPath + "/app/", 'debug.log'));
logger.debug("Run index-native.js");

const connectWindowSize = { width: 500, height: 420, center: true, minWidth: 500, minHeight: 420, titleBarStyle: 'hidden' };
const mainWindowSize    = { width: 1200, height: 800, center: true, minWidth: 1200, minHeight: 800 };
let mainWindow = null;

const template = require('./menu-native')(app);
const menu = Menu.buildFromTemplate(template);
let events;

const setWindowToNormal = () => {
  const pos  = mainWindow.getPosition();
  const size = mainWindow.getSize();
  const x    = (pos[0] + size[0]/2) - mainWindowSize.width/2;
  const y    = (pos[1] + size[1]/2) - mainWindowSize.height/2;
  mainWindow.setSize(mainWindowSize.width, mainWindowSize.height);
  mainWindow.setPosition(x, y);
};

const setWindowToLogin = () => {
  const pos  = mainWindow.getPosition();
  const size = mainWindow.getSize();
  const x    = (pos[0] + size[0]/2) - connectWindowSize.width/2;
  const y    = (pos[1] + size[1]/2) - connectWindowSize.height/2;
  mainWindow.setSize(connectWindowSize.width, connectWindowSize.height);
  mainWindow.setPosition(x, y);
};

const shutdown = () => {
  logger.info("Shutting down...");
  events.emit('shutdown');
  setTimeout(() => {
    logger.info("All done!");
    app.quit();
  }, 1000);
};

app.on('window-all-closed', shutdown);
process.on('SIGINT', () => shutdown)
process.on('SIGTERM', () => shutdown)

app.on('ready', () => {
  try {
    logger.info("Starting the systems");

    // main.start().then((res) => {
      // events = res;
      events = null;
      logger.info("Systems started");

      Menu.setApplicationMenu(menu);

      // events.on('network', (orbit) => {
      //   if(orbit)
      //     setWindowToNormal();
      //   else
      //     setWindowToLogin();
      // });

      // events.on('connected', () => {
      //   logger.error("connected");
      //   setWindowToNormal();
      // });

      // events.on('disconnect', () => {
      //   logger.error("disconnected");
      //   setWindowToLogin();
      // });

      mainWindow = new Window(connectWindowSize);

      if(process.env.ENV === 'dev')
        mainWindow.loadURL('http://localhost:8000/webpack-dev-server/');
      else
        mainWindow.loadURL('file://' + __dirname + '/client/dist/index.html');

      const getUserHome = () => {
        return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
      };

      mainWindow.webContents.session.setDownloadPath(path.resolve(getUserHome() + '/Downloads'))

      mainWindow.on('closed', () => {
        mainWindow = null;
      });
    // });
  } catch(e) {
    logger.error("Error in index-native:", e);
  }
});
