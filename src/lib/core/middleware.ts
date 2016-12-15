import { context } from 'f-promise';
import { Server } from '../application';
import { Router, Application, Request, Response, NextFunction } from 'express';
import * as bodyParser from "body-parser";
const express = require('express');
const methodOverride = require("method-override");
//
import { IModelFactory } from '../interfaces';
import { helper as objectHelper } from '../utils';


let trace; // = console.log;

const router = express.Router();
const authentication = require('express-authentication')
let auth = authentication();

export class Middleware {

    routers: Map<string, Router>;
    authMiddleware: Function;
    app: Application;
    constructor(private srv: Server, router: Router) {
        this.app = srv.app;
        this.routers = new Map();
        this.routers.set('v1', router);
    }

    configure() {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({
            extended: true
        }));

        this.app.use(function (req: Request, res: Response, next: NextFunction) {
            context()['request'] = req;
            next();
        });

    }

    setApiRoutes() {
        let apiAuth = auth.for('api').use(this.authMiddleware || function (req: Request, res: Response, next: NextFunction) {
            // Default auth middleware does nothing 
            req['authenticated'] = true;
            next();
        });

        for (var [key, router] of this.routers) {
            this.app.use(`/api/${key}`, apiAuth.required(), router);
        }
    }

    setErrorHandler() {
        this.app.use(function (err: Error, req: Request, res: Response, next: NextFunction) {
            let exposeStack = this.srv.config.system && this.srv.config.system.exposeStack;
            console.error(`*****\nError handled when processing HTTP request\n\t- ${req.method} ${req.url}\n\t- Status: ${err['status'] || res.statusCode}\n\t- Headers: ${JSON.stringify(req['headers'])}\n\t- Data: ${JSON.stringify(req['body'])}\n\t- Cause: ${exposeStack ? (err['error'] || err.stack) : err.message}\n*****`);
            if (res.headersSent) {
                return;
            }
            res.status(err['status'] || 500);
            res.json({
                $diagnoses: [{
                    $severity: 'error',
                    $message: err['error'] ? err['error'] : err.message,
                    $stack: exposeStack ? err.stack : undefined
                }]
            });
            next();
        }.bind(this));
    }
}
Object.seal(Middleware);