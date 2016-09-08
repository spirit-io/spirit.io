import { _ } from 'streamline-runtime';

import express = require ('express');
require('express-streamline');

import * as bodyParser from "body-parser";
const methodOverride = require("method-override");

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const uniqueValidator = require('mongoose-unique-validator');

import * as restify from 'express-restify-mongoose';

import { DataAccess} from "../core/DataAccess";

// var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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

        app.use((err: Error & { status: number }, request: express.Request, response: express.Response, _: _): void => {

            response.status(err.status || 500);
            response.json({
                error: "Server error"
            })
        });

        return app;
    }


    static get models() {
        var app = express();
        const router = express.Router();
        // publish models APIs
        DataAccess.models.forEach(function(model) {
            restify.serve(router, model);
        });
        app.use(router);
        return app;
    }
}
Object.seal(Middlewares);