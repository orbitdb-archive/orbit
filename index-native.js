'use strict';

const electronApp = require('app');
const Window      = require('browser-window');
const path        = require('path');
const Menu        = require('menu');
const async       = require('asyncawait/async');
const await       = require('asyncawait/await');
const logger      = require('orbit-common/lib/logger');
const utils       = require('./src/utils');
const main        = require('./src/main');

require('crash-reporter').start();
logger.debug("Run index-native.js");

const connectWindowSize = { width: 500, height: 420, center: true, minWidth: 500, minHeight: 420 };
const mainWindowSize    = { width: 1200, height: 800, center: true, minWidth: 1200, minHeight: 800 };
let mainWindow = null;

const template = require('./menu-native')(electronApp);
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
    electronApp.quit();
  }, 1000);
};

electronApp.on('window-all-closed', shutdown);
process.on('SIGINT', () => shutdown)
process.on('SIGTERM', () => shutdown)

electronApp.on('ready', async(() => {
  try {
    logger.info("Starting the systems");
    events = await(main.start());
    logger.info("Systems started");

    Menu.setApplicationMenu(menu);

    events.on('network', (orbit) => {
      if(orbit)
        setWindowToNormal();
      else
        setWindowToLogin();
    });

    events.on('connected', () => {
      logger.error("connected");
      setWindowToNormal();
    });

    events.on('disconnect', () => {
      logger.error("disconnected");
      setWindowToLogin();
    });

    mainWindow = new Window(connectWindowSize);

    if(process.env.ENV === 'dev')
      mainWindow.loadUrl('http://localhost:8000/webpack-dev-server/');
    else
      mainWindow.loadUrl('file://' + __dirname + '/client/dist/index.html');

    mainWindow.webContents.session.setDownloadPath(path.resolve(utils.getUserHome() + '/Downloads'))

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  } catch(e) {
    logger.error("Error in index-native:", e);
  }
}));
