import { run, wait } from 'f-promise';
import { Application } from 'express';

import { json, urlencoded } from "body-parser";
import { SchemaCompiler, Middleware } from "../core";
import { Contract } from "./contract";
import { IConnector } from '../interfaces';
import { ConnectorHelper } from '../core';
import { EventEmitter } from 'events';

const express = require('express');

function patchExpress(app) {
    let _handle = app.handle.bind(app);

    function logerror(err) {
        /* istanbul ignore next */
        if (this.get('env') !== 'test') console.error(err.stack || err.toString());
    }

    app.handle = function (req, res, cb) {
        var done = cb || require('finalhandler')(req, res, {
            env: this.get('env'),
            onerror: logerror.bind(app)
        });
        run(() => _handle(req, res, cb)).then(() => { done(); }).catch(e => { console.log("ERROROROR:", e.stack); done(e) });
    }

}


function patchRouter(router) {
    function restore(fn, ...obj) {
        var props = new Array(arguments.length - 2);
        var vals = new Array(arguments.length - 2);

        for (var i = 0; i < props.length; i++) {
            props[i] = arguments[i + 2];
            vals[i] = obj[props[i]];
        }

        return function (err) {
            // restore vals
            for (var i = 0; i < props.length; i++) {
                obj[props[i]] = vals[i];
            }

            return fn.apply(this, arguments);
        };
    }

    let _handle = router.handle.bind(router);
    router.handle = function (req, res, out) {
        var done = restore(out, req, 'baseUrl', 'next', 'params');
        run(() => _handle(req, res, out)).catch(e => { console.log("ERROROROR:", e.stack); done(e) });
    }
}


export class Server extends EventEmitter {

    public app: Application;
    public config: any;
    public middleware: Middleware;
    public contract: Contract;

    constructor(config: any = {}) {
        super();
        this.config = config;
        this.contract = new Contract(this.config);
    }

    init() {

        run(() => {
            this.app = express();
            let router = express.Router();

            // TODO later: patch express to handle transparently f-promise
            // patchExpress(this.app);
            // patchRouter(router)
            this.middleware = new Middleware(this, router);


            // register models
            this.contract.init();
            SchemaCompiler.registerModels(this.middleware.routers, this.contract);
            this.emit('initialized');
        }).catch(err => {
            throw err;
        });

        return this;
    }

    start(port: number) {
        // configure middleware standard rules
        this.middleware.configure();
        // initialize versioned api routes
        this.middleware.setApiRoutes();
        // set default error handler
        this.middleware.setErrorHandler();

        // start http server
        this.app.listen(port, function () {
            console.log(`Server listening on port ${port}!`);
        });
    }

    addConnector(connector: IConnector): void {
        ConnectorHelper.setConnector(connector);
    }
}