const async  = require('asyncawait/async');
const await  = require('asyncawait/await');
const logger = require('orbit-common/lib/logger');
const main   = require('./src/main');

(async(() => {
  const events = await(main.start());
  logger.info("Systems started");
}))();
