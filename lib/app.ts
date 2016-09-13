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
    private _router: Router;

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
        this._router.setErrorHandler();


        // try {

        //         User.remove(_, "57d7b8ef3b161925b0c565a2");
        //         let u1: User = new User({
        //             _id: "57d7b8ef3b161925b0c565a2",
        //             userName: "User1",
        //             firstName: "myName",
        //             lastName: "Chambard",
        //             email: "teddy.chambard@sage.com"
        //         });
        //         u1.save(_);
        //         console.log("U1: ",JSON.stringify(u1));

        //         let u2: User = <User>User.fetchInstance(_,"57d6b1bf2f643b2c7cb2da42");
        //         console.log("U2:",JSON.stringify(u2));
        //         u2.firstName = "Aurelien";
        //         u2.lastName = "Pisu";

        //         console.log(u2.hello());
        //         u2.save(_);

        //         let u3: User = <User>User.fetchInstance(_,"57d6b1bf2f643b2c7cb2da42");
        //         console.log("U3:",JSON.stringify(u3));

        //         let users: User[] = <User[]>User.fetchInstances(_, {lastName:"Chambard"});
        //         console.log("Users: "+JSON.stringify(users,null,2));


        // }catch(e) {
        //     console.error("test:",e.toString());
        // }

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