import { _ } from 'streamline-runtime';
import { Application } from 'express';

import { json, urlencoded } from "body-parser";
import { SchemaCompiler, Middleware } from "../core";
import { Contract } from "./contract";
import { IConnector } from '../interfaces';
import { ConnectorHelper } from '../core';
import { EventEmitter } from 'events';

const express = require('express');
// store init standard function
let appInit = express.application.init;
// patch express to be compliant with streamline
require('express-streamline');
// restore init standard function overrided by express-streamline
express.application.init = appInit;

export class Server extends EventEmitter {

    public app: Application;
    public config: any;
    private _middleware: Middleware;
    private _contract: Contract;

    constructor(config: any = {}) {
        super();
        this.config = config;
    }

    init(_: _) {
        this.app = express();
        this._middleware = new Middleware(this.app);
        this._contract = new Contract(this.config).init(_);
        // configure middleware standard rules
        this._middleware.configure();
        // register model and configure model routes
        SchemaCompiler.registerModels(_, this._middleware.routers, this._contract);
        this._middleware.setApiRoutes();
        // set default error handler
        this._middleware.setErrorHandler();
        this.emit('initialized');
        return this;
    }

    start(_: _, port: number) {
        var self = this;
        // start http server
        this.app.listen(port, function () {
            console.log(`Server listening on port ${port}!`);
        });

    }

    addConnector(connector: IConnector): void {
        let ds = connector.datasource;
        connector.config = this.config.connectors && this.config.connectors[ds];
        ConnectorHelper.setConnector(ds, connector);
    }
}