import 'reflect-metadata';

import { _ } from 'streamline-runtime';

import express = require ('express');
require('express-streamline');
import { json, urlencoded } from "body-parser";

const SchemaCompiler = require("./core/schemaCompiler");
import { DataAccess} from "./core/dataAccess";
import { Router } from './middlewares/router';
import { Contract } from "./contract";

export class Server {

    public app: express.Application;
    private _router: Router;

    constructor(private _port: Number) {
        this.app = express();
        this._router = new Router(this.app);

        // configure middleware standard rules
        this._router.configure();
        // register model and configure model routes
        SchemaCompiler.registerModels(this._router);
        // set default erro handler
        this._router.setErrorHandler();
        // connect to db
        DataAccess.connect();

    }

    public start(_: _) {
        var self = this;
        // start http server
        (function(cb: any) {
            self.app.listen(self._port, function () {
                cb();
            });
        })(_);
        console.log(`Server listening on port ${this._port}!`);
    }
}