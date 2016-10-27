import { _ } from 'streamline-runtime';
import core = require('express-serve-static-core');

declare module "express-serve-static-core" {

    interface RequestHandler {
        (req: core.Request, res: core.Response, _: _): any;
    }
    interface ErrorRequestHandler {
        (err: any, req: core.Request, res: core.Response, _: _): any;
    }
}