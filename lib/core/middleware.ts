import { _ } from 'streamline-runtime';
import { Router, Application, Request, Response } from 'express';
import * as bodyParser from "body-parser";
const express = require('express');
const methodOverride = require("method-override");
//
import { IModelFactory } from '../interfaces';

let trace; // = console.log;

const router = express.Router();

export class Middleware {

    routers: Map<string, Router>;
    constructor(private app: Application) {
        this.routers = new Map();
        this.routers.set('v1', express.Router());
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
        for (var [key, router] of this.routers) {
            this.app.use(`/api/${key}`, router);
        }
    }

    setErrorHandler() {
        this.app.use(function (err: Error, req: Request, res: Response, _: _) {

            console.error(`*****\nError handled when processing HTTP request\n\t- ${req.method} ${req.url}\n\t- Data: ${JSON.stringify(req['body'])}\n\t- ${err.stack}\n*****`);
            if (res.headersSent) {
                return;
            }
            res.status(500);
            res.json({ error: err.toString(), stack: err.stack });
        });
    }
}
Object.seal(Middleware);