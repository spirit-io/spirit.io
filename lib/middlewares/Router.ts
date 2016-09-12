import { _ } from 'streamline-runtime';

import express = require ('express');
require('express-streamline');

import * as bodyParser from "body-parser";
const methodOverride = require("method-override");

const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

import * as restify from 'express-restify-mongoose';

import { DataAccess} from "../core/DataAccess";
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
        console.log("Register route: "+`/${classModule._collectionName}`);
        router.get(`/${classModule._collectionName}`, modelCtrl.find);
        router.get(`/${classModule._collectionName}/:_id`, modelCtrl.findById);
        this.app.use(router);
    }

    setErrorHandler = () => {
        this.app.use(function(err: Error, req: express.Request, res: express.Response, _:_) {
            if (res.headersSent) {
                return;
            }
            console.error("error: ",err.stack);
            res.status(500);
            res.json({ error: err.message });
        });
    }
}
Object.seal(Router);