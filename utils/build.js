// Do this as the first thing so that any code reading it knows the right env.
process.env.NODE_ENV = 'production';

var webpack = require('webpack'),
  config = require('../webpack.config');

config.mode = 'production';

webpack(config, function (err) {
  if (err) throw err;
});
