"use strict";
import { MongodbConnector } from 'spirit.io-mongodb-connector';
const Mocha = require('mocha'),
    fs = require('fs'),
    path = require('path'),
    flows = require("streamline/lib/util/flows");;


const testDir = __dirname + '/test';

exports.runTests = function(_) {

    function browseDir(_, dir) {
        
        // Add each .js file to the mocha instance
        fs.readdirSync(dir).forEach_(_, function (_, file) {
            let filePath = path.join(dir, file);
            var stats = fs.lstat(filePath, _);
            if (stats.isDirectory() && !/typings$/.test(file)) {
                browseDir(_, filePath);
            } else if (stats.isFile() && /Test\.ts$/.test(file)) {
                // Only keep the .ts files
                testFiles.push(path.join(dir, file));;
            }
        });
    }



    let testFiles = [];
    let server = require('../index')();
    server.addConnector(new MongodbConnector());
    server.init();
    server.start(_, 3001);

    // wait 1 second before running test scripts
    flows.setTimeout(function(_) {
        // Instantiate a Mocha instance.
        let mochaInst = new Mocha();

        // browse directories under test
        
        browseDir(_, __dirname);
        testFiles.forEach(function (file) {
            mochaInst.addFile(file);
        });

        // Run the tests.
        let runner = mochaInst.run(function (failures) {
            process.on('exit', function () {
                process.exit(failures);  // exit with non-zero status if there were failures
            });
        });
        // register end event
        runner.on('end', function(err) {
            if (err) console.error("Mocha end error:"+err.toString());
            process.exit();
        });
    }, 1000);

}
