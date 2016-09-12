import 'reflect-metadata';

import { _ } from 'streamline-runtime';

import express = require ('express');
require('express-streamline');
import { json, urlencoded } from "body-parser";

const SchemaCompiler = require("./core/SchemaCompiler");
import { DataAccess} from "./core/DataAccess";
import { Router } from './middlewares/Router';

import { User } from './models/User';


export class Server {

    public _app: express.Application;

    constructor(private _port: Number) {
        this._app = express();
        this._router = new Router(this._app);
        
    }
    init = (_: _) => {
        // defines configuration middlewares
        this._router.configure();
        SchemaCompiler.registerModels(this._router);
        DataAccess.connect();
        this.startServer(_);
        this._router.setErrorHandler(this._app);

    }

    private startServer(_: _) {
        var self = this;
        // start http server
        (function(cb: any) {
            self._app.listen(self._port, function () {
                cb();
            });
        })(_);
        console.log(`Server listening on port ${this._port}!`);
    }
}