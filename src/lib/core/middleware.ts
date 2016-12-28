import { context } from 'f-promise';
import { Server } from '../application';
import { Registry } from './registry';
import { Application, Request, Response, NextFunction } from 'express';
import * as express from 'express';
import * as authentication from 'express-authentication';
import * as bodyParser from "body-parser";
import * as debug from 'debug';

const trace = debug('sio:middleware')
let auth = authentication();

export class Middleware {
    authMiddleware: Function;
    app: Application;
    srv: Server;
    constructor(srv: Server, ) {
        this.srv = srv;
        this.app = srv.app;
        let router = express.Router();
        Registry.setApiRouter('v1', router);
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

        for (var [key, router] of Registry.apiRouters) {
            this.app.use(`/api/${key}`, apiAuth.required(), router);
        }
    }

    setErrorHandler() {
        this.app.use(function (err: Error, req: Request, res: Response, next: NextFunction) {
            let exposeStack = this.srv.config.system && this.srv.config.system.exposeStack;
            trace(`*****\nError handled when processing HTTP request\n\t- ${req.method} ${req.url}\n\t- Status: ${err['status'] || res.statusCode}\n\t- Headers: ${JSON.stringify(req['headers'])}\n\t- Data: ${JSON.stringify(req['body'])}\n\t- Cause: ${exposeStack ? (err['error'] || err.stack) : err.message}\n*****`);
            if (res.headersSent) {
                return;
            }
            res.status(err['status'] || 500);
            res.json({
                $diagnoses: err['$diagnoses'] || [{
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