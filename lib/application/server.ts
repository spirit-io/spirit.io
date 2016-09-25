import { _ } from 'streamline-runtime';
import express = require ('express');
require('express-streamline');
import { json, urlencoded } from "body-parser";
import { SchemaCompiler, Middleware } from "../core";
import { Contract } from "./contract";
import { IConnector } from '../interfaces';
import { ConnectorHelper } from '../core';

export class Server {

    public app: express.Application;
    private _middleware: Middleware;
    private _contract: Contract;

    constructor(private _port: Number) {}

    init = (config?: any) => {
        this.app = express();
        this._middleware = new Middleware(this.app);
        this._contract = new Contract(config);
        // configure middleware standard rules
        this._middleware.configure();
        // register model and configure model routes
        SchemaCompiler.registerModels(this._middleware.routers, this._contract);
        this._middleware.setApiRoutes();
        // set default error handler
        this._middleware.setErrorHandler();
    }

    start = (_: _) => {
        var self = this;
        // start http server
        (function(cb: any) {
            self.app.listen(self._port, function () {
                cb();
            });
        })(_);
        console.log(`Server listening on port ${this._port}!`);
    }

    addConnector = (connector: IConnector): void => {
        let ds = connector.datasource;
        ConnectorHelper.setConnector(ds, connector);
    }
}