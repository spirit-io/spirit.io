"use strict";

let Server = require('./lib/application/server').Server;
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


let srv = new Server(config);
srv.on('initialized', function () {
    console.log("========== Server initialized ============\n");
});
console.log("\n========== Initialize srv begins ============");
let connector = new MockConnector(config.connectors.mock);
srv.addConnector(connector);
console.log("Connector config: " + JSON.stringify(connector.config, null, 2));
srv.init();
srv.app.use('/test', (req, res, cb) => {
    res.send('It works !');
});
srv.start(port);