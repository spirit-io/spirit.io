"use strict";

require("streamline").register({});
require ('streamline-runtime');

var Server = require('./lib/app').Server;
var port = parseInt(process.env.PORT, 10) || 3000; 
var app = new Server(port);
app.init(function(err) {
    if (err) throw err;
});