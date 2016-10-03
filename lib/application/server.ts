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
    public config: any;
    private _middleware: Middleware;
    private _contract: Contract;

    constructor(config: any = {}) {
        this.config = config;
    }

    init = () => {
        
        this.app = express();
        this._middleware = new Middleware(this.app);
        this._contract = new Contract(this.config);
        // configure middleware standard rules
        this._middleware.configure();
        // register model and configure model routes
        SchemaCompiler.registerModels(this._middleware.routers, this._contract);
        this._middleware.setApiRoutes();
        // set default error handler
        this._middleware.setErrorHandler();
        return this;
    }

    start = (_: _, port: number) => {
        var self = this;
        // start http server
        this.app.listen(port, function () {
            console.log(`Server listening on port ${port}!`);
        });
        
    }

    addConnector = (connector: IConnector): void => {
        let ds = connector.datasource;
        connector.config = this.config.connectors && this.config.connectors[ds];
        ConnectorHelper.setConnector(ds, connector);
    }
}