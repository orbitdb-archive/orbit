'use strict';

const path = require('path')
const fs = require('fs')

function getLogFilePath(orbitDataDir) {
  // Make sure we have the Orbit data directory
  if (!fs.existsSync(orbitDataDir))
    fs.mkdirSync(orbitDataDir)

  return path.join(orbitDataDir, '/debug.log')
}

function getIpfsDefaultPath(appDataDir) {
  return process.env.IPFS_PATH
    ? path.resolve(process.env.IPFS_PATH)
    : path.join(appDataDir, '/ipfs')
}

module.exports = function(app) {
  const appDataDir = app.getPath('userData')
  const MODE = process.env.ENV ? process.env.ENV : 'debug'

  if (!fs.existsSync(appDataDir))
    fs.mkdirSync(appDataDir)

  const orbitDataDir = (MODE === 'dev')
    ? path.join(process.cwd() , '/data') // put orbit's data to './data' in dev mode
    : path.join(appDataDir, '/orbit-data')

  const userDownloadPath = path.resolve(app.getPath('downloads'))

  return {
    userDownloadPath: userDownloadPath,
    appDataDir: appDataDir,
    orbitDataDir: orbitDataDir,
    logFilePath: getLogFilePath(orbitDataDir),
    ipfsDataDir: getIpfsDefaultPath(appDataDir),
    MODE: MODE
  }
}
