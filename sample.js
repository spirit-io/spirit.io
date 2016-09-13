"use strict";

require("streamline").register({});
require ('streamline-runtime');
let spirit = require('./index');

const cb = (err, res) => {
    if (err) throw err;
    return res;
}

var port = parseInt(process.env.PORT, 10) || 3000;
let server = spirit(port);
server.start(cb);
server.app.use('/test' , (req, res, cb) => {
    res.send('It works !');
});