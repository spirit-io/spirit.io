"use strict";

require("streamline").register({});
require('streamline-runtime');

var Mocha = require('mocha'),
    fs = require('fs'),
    path = require('path');

// Instantiate a Mocha instance.
var mocha = new Mocha();

var testDir = __dirname + '/test';

// Add each .js file to the mocha instance
fs.readdirSync(testDir).filter(function (file) {
    // Only keep the .js files
    return file.substr(-3) === '.ts';

}).forEach(function (file) {
    mocha.addFile(
        path.join(testDir, file)
    );
});

// Run the tests.
mocha.run(function (failures) {
    process.on('exit', function () {
        process.exit(failures);  // exit with non-zero status if there were failures
    });
});