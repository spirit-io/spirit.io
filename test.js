"use strict";

require("streamline").register({});
require('streamline-runtime');

require("./test/testServer").runTests(function(err) {
    if (err) throw err;
});