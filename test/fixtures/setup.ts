require('streamline').register({});
import { _ } from 'streamline-runtime';
import { Server } from '../../lib/application';
import { MockConnector } from './mocKConnector';
const path = require('path');
const config = {
    modelsLocation: path.resolve(path.join(__dirname, '../models')),
    connectors: {
        mongodb: {
            datasources: {
                "mongodb": {uri: "mongodb://localhost:27032/spirit-test", options: {}}
            },
            mongoose: {
                debug: false
            }
        }
    }
};

export class Fixtures {

    static setup(_) {
        let server: Server = require('spirit.io')(config);
        server.addConnector(new MockConnector());
        server.init(_);
        server.start(_, 3001);
        return server;
    }
}