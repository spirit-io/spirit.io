import { Server } from '../../lib/application';
import { MockConnector } from './mockConnector';
import { ConnectorHelper } from '../../lib/core';
import { IConnector } from '../../lib/interfaces';
import { context, run } from 'f-promise';
import { devices } from 'f-streams';
import { setup } from 'f-mocha';
import * as path from 'path';

let trace;// = console.log;

const port = 3001;
const baseUrl = 'http://localhost:' + port;

const config = {
    modelsLocation: path.resolve(path.join(__dirname, '../models')),
    connectors: {
        mock: {
            datasources: {
                "mock:1": {
                    "autoConnect": true
                },
                "mock:2": {}
            }
        }
    },
    system: {
        exposeStack: false
    }
};


function execRequest(method: string, url: string, data?: any, headers?: any): any {
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
    static cleanDatabases = (connectors: IConnector[]) => {
        connectors.forEach((c) => {
            for (var ds of c.connections.keys()) {
                c.cleanDb(ds);
            }
        })
    }
    static setup = (done) => {
        let firstSetup = true;
        let connector;
        if (!context().__server) {
            let server: Server = context().__server = new Server(config);
            run(() => {
                console.log("\n========== Initialize server begins ============");
                connector = new MockConnector(config.connectors.mock);
                server.addConnector(connector);
                console.log("Connector config: " + JSON.stringify(connector.config, null, 2));
                server.init();
            }).catch(err => {
                done(err);
            });
            server.on('initialized', function () {
                run(() => {
                    console.log("========== Server initialized ============\n");
                    server.start(port);
                }).catch(err => {
                    done(err);
                });
            });
            server.on('started', function () {
                run(() => {
                    console.log("========== Server started ============\n");
                    // this call activates f-mocha wrapper.
                    setup();
                    done();
                }).catch(err => {
                    done(err);
                });
            });
        } else {
            firstSetup = false;
        }
        //
        connector = <MockConnector>ConnectorHelper.getConnector('mock');
        connector.cleanDb();
        //
        if (!firstSetup) done();
        return context().__server;
    }

    static dumpStorage = () => {
        return (<MockConnector>ConnectorHelper.getConnector('mock')).dumpStorage();
    }

    static get = (url: string, headers?: any) => {
        return execRequest('GET', url, null, headers);
    }

    static post = (url: string, data: any, headers?: any) => {
        return execRequest('POST', url, data, headers);
    }

    static put = (url: string, data: any, headers?: any) => {
        return execRequest('PUT', url, data, headers);
    }

    static delete = (url: string, headers?: any) => {
        return execRequest('DELETE', url, null, headers);
    }

    static patch = (url: string, headers?: any) => {
        return execRequest('PATCH', url, headers);
    }
}





