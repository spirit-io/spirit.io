import { context, run } from 'f-promise';
import * as express from 'express';
import * as authentication from 'express-authentication';
import * as bodyParser from 'body-parser';
import * as debug from 'debug';
import { HandleFunction } from 'connect';

import { Server } from '../application';
import { Registry } from './registry';

const trace = debug('sio:middleware');
const auth = authentication();

export class Middleware {
    public authMiddleware: HandleFunction;
    public app: express.Application;
    public srv: Server;

    constructor(srv: Server) {
        this.srv = srv;
        this.app = srv.app;
        const router = express.Router();
        Registry.setApiRouter('v1', router);
    }

    public configure() {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({
            extended: true,
        }));

        this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            run(() => {
                context().request = req;
                next();
            }).catch((e) => {
                next(e);
            });
        });
    }

    public setApiRoutes() {
        const apiAuth = auth.for('api').use(this.authMiddleware || this.defaultAuthMiddleware);

        for (const [key, router] of Registry.apiRouters) {
            this.app.use(`/api/${key}`, apiAuth.required(), router);
        }
    }

    public setErrorHandler = () => {
        this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
            const exposeStack = this.srv.config.system && this.srv.config.system.exposeStack;
            // tslint:disable-next-line
            trace(`*****\nError handled when processing HTTP request\n\t` +
                `- ${req.method} ${req.url}\n\t` +
                `- Status: ${err.status || 500}\n\t` +
                `- Headers: ${JSON.stringify(req.headers)}\n\t` +
                `- Data: ${JSON.stringify(req.body)}\n\t` +
                `- Cause: ${exposeStack ? (err.error || err.stack) : err.message}\n*****`);
            if (res.headersSent) {
                return;
            }
            res.status(err.status || 500);
            res.json({
                $diagnoses: err.$diagnoses || [{
                    $severity: 'error',
                    $message: err.error ? err.error : err.message,
                    $stack: exposeStack ? err.stack : undefined,
                }],
            });
            next();
        });
    };

    private defaultAuthMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
        // Default auth middleware does nothing
        (req as any).authenticated = true;
        next();
    }
}

Object.seal(Middleware);
