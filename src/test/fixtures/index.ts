import { Server } from '../../lib/application';
import { context, run } from 'f-promise';
import { devices } from 'f-streams';
import { setup } from 'f-mocha';
import * as path from 'path';
import { Registry } from '../../lib/core';

let trace;// = console.log;

const port = 3001;
const baseUrl = 'http://localhost:' + port;

const default_config = {
    modelsLocation: path.resolve(path.join(__dirname, '../models')),

    system: {
        exposeStack: true
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


function removaAllDocuments(done) {
    Registry.factories.forEach(function (factory) {
        if (factory.persistent) {
            factory.actions.delete({ all$: true });
        }
    });
}

export class Fixtures {
    static setup = (done, config?: any) => {
        config = config || default_config;
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
                    removaAllDocuments(done)

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
                removaAllDocuments(done)
                firstSetup = false;
                done();
            }).catch(err => {
                done(err);
            });

        }

        return context().__server;
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





