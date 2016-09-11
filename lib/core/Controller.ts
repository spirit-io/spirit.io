
import { _ } from 'streamline-runtime';
import express = require("express");
import mongoose = require("mongoose");



export class Controller {

    constructor (private _model: mongoose.Model<mongoose.Document>, private _class: any) {}

    find = (req: express.Request, res: express.Response, _:_): void  => {
        try {
            let where: string = req.query['where'];
            if (where) {
                try {
                    where = JSON.parse(where)
                } catch(err) {
                    res.status(500);
                    res.send(`Invalid where filter: ${where}`);
                }
            }
            let result = this._class.find(_, where);
            res.json(result);
        }
        catch (e)  {
            console.log(e.stack);
            res.send("error in your request:"+e.message);
        }
    }

    findById = (req: express.Request, res: express.Response, _:_): void  => {
        try {
            var _id: string = req.params['_id'];
            let result = this._class.findById(_, _id);
            res.json(result);
        }
        catch (e)  {
            console.log(e.stack);
            res.send("error in your request:"+e.message);
        }
    }

    

} 