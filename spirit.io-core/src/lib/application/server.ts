/* tslint:disable:no-console */
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as express from 'express';
import * as https from 'https';
import * as http from 'http';

import { Middleware, ConnectorHelper } from '../core';
import { Contract } from './contract';
import { IConnector } from '../interfaces';

/**
 * Create a spirit.io server.
 * This is main entry point of the application.
 */
export class Server extends EventEmitter {
    /** The config object */
    public config: any;
    /** The express application */
    public app: express.Application;
    /** The server's middleware */
    public middleware: Middleware;
    /** The server's contract */
    public contract: Contract;

    private server: http.Server | https.Server;

    /**
     * A config object must be passed in the constructor.
     * See config file documentation.
     */
    constructor(config: any = {}) {
        super();
        this.config = config;
        this.contract = new Contract(this.config);
    }

    /**
     * Initialize the express application and the middleware rules.
     * All the models registered in the contract would be compiled during this phase.
     * An event `initialized` will be emitted when the server would be ready to be started.
     */
    public init() {
        this.app = express();

        // TODO later: patch express to handle transparently f-promise
        // patchExpress(this.app);
        // patchRouter(router)
        this.middleware = new Middleware(this);

        // initialize the contract
        this.contract.init();
        this.emit('initialized');
        // configure middleware standard rules
        this.middleware.configure();
        // initialize versioned api routes
        this.middleware.setApiRoutes();
        // set default error handler
        this.middleware.setErrorHandler();

        return this;
    }

    /**
     * Configure the main middleware rules.
     * It will also set all the API routes for every registered models.
     * And finally starts the HTTP server regarding the HTTP config elements.
     */
    public start(port?: number): Promise<void> {
        const httpPort = port || this.config.port || (this.config.https ? 443 : 80);

        this.server = this.createHttpServer();
        return new Promise((resolve, reject) => {
            this.server.listen(httpPort, (err) => {
                if (err) {
                    reject(err);
                }
                console.log(`Http server started successfully on port ${httpPort}`);
                this.emit('started');
                resolve();
            });
        });
    }

    public close(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.server || !this.server.listening) {
                console.log('Http server already stopped !');
                return resolve();
            }
            this.server.close((err) => {
                if (err) {
                    reject(err);
                }
                console.log('Http server stopped successfully');
                resolve();
            });
        });
    }

    public checkHealth(): void {
        if (!this.server || !this.server.listening) {
            throw new Error('Http server is not Listening');
        }
    }

    /**
     * Allows the register spirit.io connectors.
     */
    public addConnector(connector: IConnector): void {
        ConnectorHelper.setConnector(connector);
    }

    private createHttpServer(): http.Server | https.Server {
        const ssl = this.config.ssl || { use: false };
        if (ssl.use) {
            try {
                const credentials = {
                    key: fs.readFileSync(ssl.key || '', 'utf8'),
                    cert: fs.readFileSync(ssl.cert || '', 'utf8'),
                };
                return https.createServer(credentials, this.app);
            } catch (err) {
                console.error(`Error while creating https server with key: ${ssl.key} and certificate: ${ssl.cert}; `, err);
                throw err;
            }
        }
        return http.createServer(this.app);
    }
}
