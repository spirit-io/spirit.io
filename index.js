"use strict";

require("streamline").register({});
require('streamline-runtime');

var Server = require('./lib/application/server').Server;

module.exports = function (config) {
    return new Server(config);
};