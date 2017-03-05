import { Server } from '../../lib/application';
import { context, run } from 'f-promise';
import { devices } from 'f-streams';
import { setup } from 'f-mocha';
import * as path from 'path';
import { Registry } from '../../lib/core';

let trace;// = console.log;

const port = 3000;

const default_config = {
    modelsLocation: path.resolve(path.join(__dirname, '../models')),
    port: port,
    https: true,
    certs: path.resolve(path.join(__dirname, '../../certs')),
    system: {
        exposeStack: true
    }
};

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Avoids DEPTH_ZERO_SELF_SIGNED_CERT error for self-signed certs


let config;

export class Fixtures {
    static removaAllDocuments() {
        Registry.factories.forEach(function (factory) {
            if (factory.persistent) {
                factory.actions.delete({ all$: true });
            }
        });
    }

    static init = (_config) => {
        config = _config || default_config;
    }

    static setup = (done, _config?: any) => {
        Fixtures.init(_config);
        let firstSetup = true;
        if (!context().__server) {
            let server: Server = context().__server = new Server(config);
            run(() => {
                console.log("\n========== Initialize server begins ============");
                // TODO : inject dependency store
                server.init();
            }).catch(err => {
                done(err);
            });
            server.on('initialized', function () {
                run(() => {
                    console.log("========== Server initialized ============\n");
                    Fixtures.removaAllDocuments()

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
            run(() => {
                Fixtures.removaAllDocuments()
                firstSetup = false;
                done();
            }).catch(err => {
                done(err);
            });

        }

        return context().__server;
    }


    private static execRequest = (method: string, url: string, data?: any, headers?: any): any => {
        headers = headers || {
            'content-type': 'application/json'
        };
        const baseUrl = (config.https ? 'https' : 'http') + '://localhost:' + config.port;

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
    static get = (url: string, headers?: any) => {
        return Fixtures.execRequest('GET', url, null, headers);
    }

    static post = (url: string, data: any, headers?: any) => {
        return Fixtures.execRequest('POST', url, data, headers);
    }

    static put = (url: string, data: any, headers?: any) => {
        return Fixtures.execRequest('PUT', url, data, headers);
    }

    static delete = (url: string, headers?: any) => {
        return Fixtures.execRequest('DELETE', url, null, headers);
    }

    static patch = (url: string, headers?: any) => {
        return Fixtures.execRequest('PATCH', url, headers);
    }
}





