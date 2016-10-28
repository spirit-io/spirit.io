/// <reference path="../../index.d.ts" />
import { _ } from 'streamline-runtime';
import express = require("express");
import { IModelController, IModelActions, IModelFactory } from '../interfaces';

export class ModelControllerBase implements IModelController {

    private _actions: IModelActions;
    private _target: any;

    constructor(private modelFactory: IModelFactory) {
        this._actions = modelFactory.actions;
        this._target = modelFactory.targetClass;
    }
    query (req: express.Request, res: express.Response, _: _): void {
        let where: string = req.query['where'];
        if (where) {
            try {
                where = JSON.parse(where)
            } catch (err) {
                throw new Error(`Invalid where filter: ${where}`);
            }
        }
        let includes: string = req.query['includes'];
        let result = this._actions.query(_, where, { includes: includes });
        res.json(result);
    }

    read (req: express.Request, res: express.Response, _: _): void {
        let _id: string = req.params['_id'];
        let _ref: string = req.params['_ref'];
        let includes: string = req.query['includes'];

        let readOptions = _ref ? {} : { includes: includes, ref: _ref };
        let result = this._actions.read(_, _id, readOptions);
        if (!result) {
            res.sendStatus(404);
        } else {
            res.json(result);
        }
    }

    create (req: express.Request, res: express.Response, _ : _): void {
        let item: any = req['body'];
        let result = this._actions.create(_, item);
        res.json(result);
    }

    update (req: express.Request, res: express.Response, _: _): void {
        let _id: string = req.params['_id'];
        let _ref: string = req.params['_ref'];
        let item: any = req['body'];

        if (_ref) {
            let data = {};
            data[_ref] = item;
            let result = this._actions.update(_, _id, data, {reference: _ref, deleteMissing: true});
            res.json(result);
        } else {
            let result = this._actions.update(_, _id, item, {deleteMissing: true});
            res.json(result);
        }
    }

    patch (req: express.Request, res: express.Response, _: _): void {
        let _id: string = req.params['_id'];
        let _ref: string = req.params['_ref'];
        let item: any = req['body'];

        if (_ref) {
            let data = {};
            data[_ref] = item;
            let result = this._actions.update(_, _id, data, {reference: _ref});
            res.json(result);
        } else {
            let result = this._actions.update(_, _id, item);
            res.json(result);
        }
    }

    delete (req: express.Request, res: express.Response, _: _): void {
        let _id: string = req.params['_id'];
        let result = this._actions.delete(_, _id);
        res.json(result);
    }

    executeService (req: express.Request, res: express.Response, _: _): void {
        let _name: string = req.params['_name'];
        if (this.modelFactory.$statics.indexOf(_name) === -1 || !this._target[_name]) {
            res.sendStatus(404);
            return;
        }
        let result = this._target[_name]();
        res.json(result);
    }

    executeMethod (req: express.Request, res: express.Response, _: _): void {
        let _id: string = req.params['_id'];
        let _name: string = req.params['_name'];
        let inst = this.modelFactory.helper.fetchInstance(_, _id);
        if (this.modelFactory.$methods.indexOf(_name) === -1 || !inst || (inst && !inst[_name])) {
            res.sendStatus(404);
            return;
        }
        
        let result = inst[_name]();
        res.json(result);
    }
} 