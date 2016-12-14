import { run, wait } from 'f-promise';
import { Application } from 'express';

import { json, urlencoded } from "body-parser";
import { SchemaCompiler, Middleware } from "../core";
import { Contract } from "./contract";
import { IConnector } from '../interfaces';
import { ConnectorHelper } from '../core';
import { EventEmitter } from 'events';

const express = require('express');
const expressPromise = require('express-promise');

// // store init standard function
// let appInit = express.application.init;
// // patch express to be compliant with streamline
// require('express-streamline');
// // restore init standard function overrided by express-streamline
// express.application.init = appInit;

export class Server extends EventEmitter {

    public app: Application;
    public config: any;
    public middleware: Middleware;
    public contract: Contract;

    constructor(config: any = {}) {
        super();
        this.config = config;

        this.app = express();
        //this.app.use(expressPromise());
        this.middleware = new Middleware(this);
        this.contract = new Contract(this.config);
    }

    init() {
        // register models
        this.contract.init();
        run(() => SchemaCompiler.registerModels(this.middleware.routers, this.contract))
            .then(() => { }, err => { throw err; });

        return this;
    }

    start(port: number) {
        // configure middleware standard rules
        this.middleware.configure();
        // initialize versioned api routes
        this.middleware.setApiRoutes();
        // set default error handler
        this.middleware.setErrorHandler();
        this.emit('initialized');
        // start http server
        this.app.listen(port, function() {
            console.log(`Server listening on port ${port}!`);
        });

    }

    addConnector(connector: IConnector): void {
        ConnectorHelper.setConnector(connector);
    }
}