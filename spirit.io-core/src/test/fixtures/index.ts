/* tslint:disable:no-console */
import { Server } from '../../lib/application';
import { MockConnector } from './mockConnector';
import { ConnectorHelper } from '../../lib/core';
import { IConnector } from '../../lib/interfaces';
import { context, run, wait } from 'f-promise';
import { devices } from 'f-streams';
import { setup } from 'f-mocha';
import * as path from 'path';

const trace: any = undefined; // = console.log;

const port = 3001;
const baseUrl = `http://localhost:${port}`;

const config = {
    modelsLocation: path.resolve(path.join(__dirname, '../models')),
    connectors: {
        mock: {
            datasources: {
                'mock:1': {
                    autoConnect: true,
                },
                'mock:2': {},
            },
        },
    },
    system: {
        exposeStack: false,
    },
};

function execRequest(method: string, url: string, data?: any, headers: any = {
    'content-type': 'application/json',
}): any {
    trace && trace(`HTTP ${method} ${baseUrl}${url}`);
    const resp = devices.http.client({
        url: baseUrl + url,
        method,
        headers,
    }).proxyConnect().end(data ? JSON.stringify(data) : undefined).response();
    return {
        status: resp.statusCode,
        headers: resp.headers,
        body: resp.readAll(),
    };
}

export class Fixtures {
    public static cleanDatabases = (connectors: IConnector[]) => {
        connectors.forEach((c) => {
            for (const ds of c.connections.keys()) {
                c.cleanDb(ds);
            }
        });
    };

    public static setup = (): Server => {
        let connector;
        let server: Server = context().__server;

        if (!server) {
            server = context().__server = new Server(config);

            console.log('\n========== Initialize server begins ============');
            connector = new MockConnector(config.connectors.mock);
            server.addConnector(connector);
            console.log(`Connector config: ${JSON.stringify(connector.config, null, 2)}`);
            server.init();
            wait(server.start(port));

        } else {
            try {
                server.checkHealth();
            } catch (e) {
                wait(server.start(port));
            }
        }
        //
        connector = ConnectorHelper.getConnector('mock') as MockConnector;
        connector.cleanDb();
        //
        return server;
    };

    public static shutdown = () => {
        const server: Server = context().__server;
        if (server) {
            wait(server.close());
        }
    };

    public static dumpStorage = () => {
        return (ConnectorHelper.getConnector('mock') as MockConnector).dumpStorage();
    };

    public static get = (url: string, headers?: any) => {
        return execRequest('GET', url, null, headers);
    };

    public static post = (url: string, data: any, headers?: any) => {
        return execRequest('POST', url, data, headers);
    };

    public static put = (url: string, data: any, headers?: any) => {
        return execRequest('PUT', url, data, headers);
    };

    public static delete = (url: string, headers?: any) => {
        return execRequest('DELETE', url, null, headers);
    };

    public static patch = (url: string, headers?: any) => {
        return execRequest('PATCH', url, headers);
    };
}
