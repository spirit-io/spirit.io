"use sctrict";
import * as ts from "typescript";
import * as path from "path";
import { Contract } from "../contract";
import * as SchemaCompiler from '../core/SchemaCompiler';
const uniqueValidator = require('mongoose-unique-validator');

// need require for mongoose
import { Connection, Schema, Model } from 'mongoose';
const mongoose = require('mongoose');


export class DataAccess {
    static mongooseInstance: any;
    static mongooseConnection: Connection;
    private static _models: Model<any>[];

    public static connect (): Connection {
        if(this.mongooseInstance) return this.mongooseInstance;
        
        this.mongooseConnection  = mongoose.connection;
        this.mongooseConnection.once("open", () => {
            console.log("Connected on mongodb: "+Contract.DB_CONNECTION);
        });
        
        this.mongooseInstance = mongoose.connect(Contract.DB_CONNECTION);
        return this.mongooseInstance;
    }

    public static registerSchemas (): void {
        let self = this;
        this._models = [];
        SchemaCompiler.generateMongooseSchema(['../models/Auto.ts', '../models/User.ts'].map(function(f) {
            return path.resolve(path.join(__dirname, f));
        }), {
            target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
        }).forEach(function(modelDef) {
            modelDef.schema.plugin(uniqueValidator);
            self._models.push(mongoose.model(modelDef.collectionName, modelDef.schema));
        });
    }

    public static get models(): Model<any>[] {
        return this._models;
    }


}