import { _ } from 'streamline-runtime';

import express = require ('express');
require('express-streamline');
import * as bodyParser from "body-parser";
const methodOverride = require("method-override");
//
import { IModelFactory } from '../interfaces';

let trace; // = console.log;

const router = express.Router();

function errorHandler(err: Error, req: express.Request, res: express.Response, _:_) {
  if (res.headersSent) {
    return;
  }
  console.log("Err: ",err);
  res.status(500);
  res.json({ error: err.message });
}

export class Middleware {

    router: express.Router;
    constructor(private app: express.Application) {
        this.router = express.Router();
    }

    configure = () => {
        // this.app.use(new Routes().routes);
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({
            extended: true
        }));

        this.app.use(methodOverride("X-HTTP-Method"));          
        this.app.use(methodOverride("X-HTTP-Method-Override")); 
        this.app.use(methodOverride("X-Method-Override"));      
        this.app.use(methodOverride("_method"));


        this.app.get("/", (request: express.Request, response: express.Response) => {
            response.json({
                name: "Express application"
            })
        });

    }

    useRouter = (router: express.Router) => {
        this.app.use(router);
    }

    

    setErrorHandler = () => {
        this.app.use(function(err: Error, req: express.Request, res: express.Response, _:_) {
            if (res.headersSent) {
                return;
            }
            console.error("error: ",err.stack);
            res.status(500);
            res.json({ error: err.toString() });
        });
    }
}
Object.seal(Middleware);