"use strict";

require("streamline").register({});
require('streamline-runtime');
let spirit = require('./lib');
let MockConnector = require('./test/fixtures/mockConnector').MockConnector;
const path = require('path');
const port = 3001;
const baseUrl = 'http://localhost:' + port;

const config = {
    // defaultDatasource: 'mock',
    modelsLocation: path.resolve(path.join(__dirname, './test/models')),
    connectors: {
        mock: {
            datasources: {
                "mock": {}
            }
        }
    }
};


let server = spirit(config);



server.on('initialized', function () {
    console.log("========== Server initialized ============\n");
});
console.log("\n========== Initialize server begins ============");
let connector = new MockConnector(config.connectors.mock);
server.addConnector(connector);
console.log("Connector config: " + JSON.stringify(connector.config, null, 2));
server.init();
server.app.use('/test', (req, res, cb) => {
    res.send('It works !');
});
server.start(port);