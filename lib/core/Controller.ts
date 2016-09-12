
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
        let _id: string = req.params['_id'];
        let result = this._class.findById(_, _id);
        if (!result) res.sendStatus(404);
        else res.json(result);
    }

    create = (req: express.Request, res: express.Response, _:_): void {
        let item: any = req.body;
        let result = this._class.create(_, item);
        res.json(result);
    }

    update = (req: express.Request, res: express.Response, _:_): void {
        let _id: string = req.params['_id'];
        let item: any = req.body;
        let result = this._class.update(_, _id, item);
        res.json(result);
    }

    remove = (req: express.Request, res: express.Response, _:_): void {
        let _id: string = req.params['_id'];
        let result = this._class.remove(_, _id);
        res.json(result);
    }
} 