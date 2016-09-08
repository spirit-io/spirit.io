import * as read from "./interfaces/ReadController";
import * as write from "./interfaces/WriteController";
import { _ } from 'streamline-runtime';
import express = require("express");
import mongoose = require("mongoose");

class ETL<T> implements read.IRead<T>, write.IWrite<T> {

    constructor (private _model: mongoose.Model<mongoose.Document>) {}

    retrieve (_:_): any {
        return this._model.find({}, _);
    }
}

export class Controller<T extends ETL<Object>> implements read.ReadController, write.WriteController {

    constructor (private _model: mongoose.Model<mongoose.Document>) {}

    retrieve(req: express.Request, res: express.Response, _:_): void {
        try {  
            let etl = new ETL(this._model);
            let result = etl.retrieve(_);
            console.log("Res: ", res);
            res.send(result);
        }
        catch (e)  {
            console.log(e);
            res.send("error in your request:"+e.stack);

        }
    }

} 