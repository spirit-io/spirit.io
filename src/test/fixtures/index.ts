import { Server } from '../../lib/application';
import { MockConnector } from './mockConnector';
import { ConnectorHelper } from '../../lib/core';
import { context } from 'f-promise';
import { devices } from 'f-streams';
import { setup } from 'f-mocha';

const path = require('path');

let trace;// = console.log;

const port = 3001;
const baseUrl = 'http://localhost:' + port;

const config = {
    modelsLocation: path.resolve(path.join(__dirname, '../models')),
    connectors: {
        mock: {
            datasources: {
                "mock": {}
            }
        }
    },
    system: {
        exposeStack: false
    }
};


function request(method: string, url: string, data?: any, headers?: any) {
    headers = headers || {
        'content-type': 'application/json'
    };
    trace && trace("HTTP " + method + " " + baseUrl + url);
    let resp = devices.http.client({
        url: baseUrl + url,
        method: method,
        headers: headers
    }).proxyConnect().end(data ? JSON.stringify(data) : undefined).response();
    return {
        status: resp.statusCode,
        headers: resp.headers,
        body: resp.readAll()
    };
}

export class Fixtures {

    static setup = (done) => {
        let firstSetup = true;
        let connector;
        if (!context().__server) {
            let server: Server = context().__server = new Server(config);
            server.on('initialized', function () {
                console.log("========== Server initialized ============\n");
                // this call activates f-mocha wrapper.
                setup();
                done();
            });
            console.log("\n========== Initialize server begins ============");
            connector = new MockConnector(config.connectors.mock);
            server.addConnector(connector);
            console.log("Connector config: " + JSON.stringify(connector.config, null, 2));
            server.init();
            server.start(3001);
        } else {
            firstSetup = false;
        }
        //
        connector = <MockConnector>ConnectorHelper.getConnector('mock');
        connector.resetStorage();
        //
        if (!firstSetup) done();
        return context().__server;
    }

    static dumpStorage = () => {
        return (<MockConnector>ConnectorHelper.getConnector('mock')).dumpStorage();
    }

    static get = (url: string, headers?: any) => {
        return request('GET', url, null, headers);
    }

    static post = (url: string, data: any, headers?: any) => {
        return request('POST', url, data, headers);
    }

    static put = (url: string, data: any, headers?: any) => {
        return request('PUT', url, data, headers);
    }

    static delete = (url: string, headers?: any) => {
        return request('DELETE', url, null, headers);
    }

    static patch = (url: string, headers?: any) => {
        return request('PATCH', url, headers);
    }

    static execAsync = (done, fn): void => {
        fn(function (err, res) {
            if (err) done(err);
            else done();
        });
    }
}





