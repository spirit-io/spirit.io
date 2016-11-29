import { _ } from 'streamline-runtime';
import { Router, Application, Request, Response } from 'express';
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
    authMiddlewares: Map<string, Function>;

    constructor(private app: Application, midSettings: any) {
        this.routers = new Map();
        this.routers.set('v1', express.Router());
        this.authMiddlewares = new Map();
        if (midSettings && midSettings.auth) {
            objectHelper.forEachKey(midSettings.auth, (key: string, fn: Function) => {
                this.authMiddlewares.set(key, fn);
            });
        }
    }

    configure() {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({
            extended: true
        }));

        this.app.use(methodOverride("X-HTTP-Method"));
        this.app.use(methodOverride("X-HTTP-Method-Override"));
        this.app.use(methodOverride("X-Method-Override"));
        this.app.use(methodOverride("_method"));

        this.app.use(function (req: Request, res: Response, _: _) {
            _.context['request'] = req;
        });

        this.app.get("/", (request: Request, response: Response) => {
            response.json({
                name: "Express application"
            })
        });
    }

    setApiRoutes() {

        let apiAuth = auth.for('api').use(this.authMiddlewares.get('api') || function (req, res, _) {
            // Default auth middleware does nothing 
            req.authenticated = true;
        });

        for (var [key, router] of this.routers) {
            this.app.use(`/api/${key}`, apiAuth.required(), router);
        }
    }

    setErrorHandler() {
        this.app.use(function (err: Error, req: Request, res: Response, _: _) {
            console.error(`*****\nError handled when processing HTTP request\n\t- ${req.method} ${req.url}\n\t- Headers: ${JSON.stringify(req['headers'])}\n\t- Data: ${JSON.stringify(req['body'])}\n\t- ${err['error'] || err.stack}\n*****`);
            if (res.headersSent) {
                return;
            }
            res.status(err['status'] || 500);
            res.json({ error: err['error'] ? err['error'] : err.toString(), stack: err.stack });
        });
    }
}
Object.seal(Middleware);