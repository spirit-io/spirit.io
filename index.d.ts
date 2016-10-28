import { _ } from 'streamline-runtime';
import express = require('express');
import core = require('express-serve-static-core');

declare module "express-serve-static-core" {

    interface RequestHandler extends express.RequestHandler{
        (req: core.Request, res: core.Response, _: _): any;
    }
    interface ErrorRequestHandler extends express.RequestHandler {
        (err: any, req: core.Request, res: core.Response, _: _): any;
    }
}