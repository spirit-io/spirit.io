import 'reflect-metadata';

import { _ } from 'streamline-runtime';

import express = require ('express');
// require('express-streamline');
import { json, urlencoded } from "body-parser";
import { Middlewares } from './middlewares/Middlewares';
import { Controller } from './controllers/Controller';

import { User } from './models/User';
import { DataAccess} from "./core/DataAccess";

export class Server {

    private _app: express.Application;

    constructor(private _port: Number) {
        this._app = express();
        
    }
    init(_: _) {
        DataAccess.registerSchemas();
        DataAccess.connect();
        this.startServer(_);
    }

    private startServer(_: _) {
        var self = this;
        // defines configuration middlewares
        this._app.use(Middlewares.configuration);
        // defines models middlewares
        this._app.use(Middlewares.models);
        // start http server
        (function(cb: any) {
            self._app.listen(self._port, function () {
                cb();
            });
        })(_);
        console.log(`Server listening on port ${this._port}!`);
    }
}