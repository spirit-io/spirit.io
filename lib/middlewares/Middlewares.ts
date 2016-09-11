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

export class Middlewares {

    static get configuration() {
        var app = express();
        
        // app.use(new Routes().routes);
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({
            extended: true
        }));

        app.use(methodOverride("X-HTTP-Method"));          
        app.use(methodOverride("X-HTTP-Method-Override")); 
        app.use(methodOverride("X-Method-Override"));      
        app.use(methodOverride("_method"));


        app.get("/", (request: express.Request, response: express.Response) => {
            response.json({
                name: "Express application"
            })
        });
/*
        app.use((err: Error & { status: number }, request: express.Request, response: express.Response, _: _): void => {

            response.status(err.status || 500);
            response.json({
                error: "Server error"
            })
        });
*/
        app.use(express.Router());
        return app;
    }


    static setupModel = (app: express.Application, classModule: any) => {
        let modelCtrl = new Controller(classModule._model, classModule);
        console.log("Register route: "+`/${classModule._collectionName}`);
        router.get(`/${classModule._collectionName}`, modelCtrl.find);
        router.get(`/${classModule._collectionName}/:_id`, modelCtrl.findById);
        app.use(router);
    }
}
Object.seal(Middlewares);