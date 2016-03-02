var electronApp   = require('app');
var BrowserWindow = require('browser-window');
var path          = require('path');
var Menu          = require('menu');
var async         = require('asyncawait/async');
var await         = require('asyncawait/await');

var main          = require('./main');
var logger        = require('./core/logger');
var utils         = require('./core/utils');

require('crash-reporter').start();
logger.info("Run index-native.js");

var connectWindowSize = { width: 300, height: 500, center: true, minWidth: 300, minHeight: 500 };
var mainWindowSize    = { width: 1200, height: 800, center: true, minWidth: 1200, minHeight: 800 };
var mainWindow = null;

var template = require('./menu-native')(electronApp);
menu = Menu.buildFromTemplate(template);

process.on('SIGINT', () => electronApp.quit())
process.on('SIGTERM', () => electronApp.quit())

electronApp.on('window-all-closed', () => {
  if (process.platform != 'darwin') {
    electronApp.quit();
  }
});

electronApp.on('ready', async(() => {
  try {
    logger.info("Starting the system");
    var events = await(main.start());
    logger.info("System started");

    Menu.setApplicationMenu(menu);

    events.on('connected', () => {
      var pos  = mainWindow.getPosition();
      var size = mainWindow.getSize();
      var x    = (pos[0] + size[0]/2) - mainWindowSize.width/2;
      var y    = (pos[1] + size[1]/2) - mainWindowSize.height/2;
      mainWindow.setSize(mainWindowSize.width, mainWindowSize.height);
      mainWindow.setPosition(x, y);
    });

    events.on('disconnect', () => {
      var pos  = mainWindow.getPosition();
      var size = mainWindow.getSize();
      var x    = (pos[0] + size[0]/2) - connectWindowSize.width/2;
      var y    = (pos[1] + size[1]/2) - connectWindowSize.height/2;
      mainWindow.setSize(connectWindowSize.width, connectWindowSize.height);
      mainWindow.setPosition(x, y);
    });

    mainWindow = new BrowserWindow(connectWindowSize);
    // mainWindow.setMinimumSize(connectWindowSize.minWidth, connectWindowSize.minHeight);

    if(process.env.ENV === 'dev')
      mainWindow.loadUrl('http://localhost:8000/webpack-dev-server/');
    else
      mainWindow.loadUrl('file://' + __dirname + '/client/dist/index.html');

    mainWindow.webContents.session.setDownloadPath(path.resolve(utils.getUserHome() + '/Downloads'))
    // mainWindow.openDevTools();

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  } catch(e) {
    logger.error("Error in index-native:", e);
  }
}));
