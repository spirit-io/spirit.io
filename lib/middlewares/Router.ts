import { _ } from 'streamline-runtime';
import express = require ('express');
require('express-streamline');
import * as bodyParser from "body-parser";
const methodOverride = require("method-override");
//
import { Controller } from '../core/Controller';

const router = express.Router();

function errorHandler(err: Error, req: express.Request, res: express.Response, _:_) {
  if (res.headersSent) {
    return;
  }
  console.log("Err: ",err);
  res.status(500);
  res.json({ error: err.message });
}

export class Router {

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

        this.app.use(express.Router());
    }


    setupModel = (classModule: any) => {
        let modelCtrl = new Controller(classModule._model, classModule);
        let name = classModule._collectionName;
        console.log("Register route: "+`/${classModule._collectionName}`);
        router.get(`/${name}`, modelCtrl.find);
        router.get(`/${name}/:_id`, modelCtrl.findById);
        router.post(`/${name}`, modelCtrl.create);
        router.put(`/${name}/:_id`, modelCtrl.update);
        router.delete(`/${name}/:_id`, modelCtrl.remove);
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
Object.seal(Router);