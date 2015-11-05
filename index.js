var async  = require('asyncawait/async');
var await  = require('asyncawait/await');
var main   = require('./main');
var logger = require('./core/logger');

(async(() => {
  var started = await(main.start());
  logger.info("System started");
}))();
