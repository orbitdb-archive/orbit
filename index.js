const main   = require('./src/main');

const Logger = require('logplease');
const logger = Logger.create("Orbit.Index");
Logger.setLogfile('debug.log');

(() => {
  main.start()
    .then((events) => logger.info("Systems started"))
    .catch((e) => {
      logger.error(e.message);
      logger.error("Stack trace:\n", e.stack);
    });
})();
