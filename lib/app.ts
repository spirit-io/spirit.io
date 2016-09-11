import 'reflect-metadata';

import { _ } from 'streamline-runtime';

import express = require ('express');
require('express-streamline');
import { json, urlencoded } from "body-parser";

const SchemaCompiler = require("./core/SchemaCompiler");
import { DataAccess} from "./core/DataAccess";
import { Middlewares } from './middlewares/Middlewares';

import { User } from './models/User';


export class Server {

    private _app: express.Application;

    constructor(private _port: Number) {
        this._app = express();
        
    }
    init(_: _) {
        // defines configuration middlewares
        this._app.use(Middlewares.configuration);
        SchemaCompiler.registerModels(this._app);
        DataAccess.connect();
        this.startServer(_);
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