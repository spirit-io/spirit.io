
import { _ } from 'streamline-runtime';
import express = require("express");
import mongoose = require("mongoose");



export class Controller {

    constructor (private _model: mongoose.Model<mongoose.Document>, private _class: any) {}

    find = (req: express.Request, res: express.Response, _:_): void  => {
        let where: string = req.query['where'];
        if (where) {
            try {
                where = JSON.parse(where)
            } catch(err) {
                throw new Error(`Invalid where filter: ${where}`);
            }
        }
        let result = this._class.find(_, where);
        res.json(result);
    }

    findById = (req: express.Request, res: express.Response, _:_): void  => {
        var _id: string = req.params['_id'];
        let result = this._class.findById(_, _id);
        if (!result) res.sendStatus(404);
        else res.json(result);
    }
} 