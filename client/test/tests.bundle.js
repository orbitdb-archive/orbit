// tests.webpack.js
var context = require.context('./', true, /.+\.test\.jsx?$/);

require('core-js/es5');

context.keys().forEach(context);

console.log(context)
module.exports = context;