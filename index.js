"use strict";

require("streamline").register({});
require ('streamline-runtime');

var Server = require('./lib/server').Server;

module.exports = function(port, config) {
    return new Server(port, config);
};