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
    private _router: express.Router;

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


        try {
            /*
                let u = new User({userName: "Ted2", email: "teddy.chambard@gmail.com", firstName: "Teddy"});
                let res = u.save(_);
                console.log("Res: ",res);
*/
/*
    let u2: User = <User>User.fetchInstance(_,"57d7961c475ae6041e497e0b");
    console.log("U2:",JSON.stringify(u2));
console.log("name:"+u2.firstName);
*/
        }catch(e) {
            console.error("test:",e.toString());
        }

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