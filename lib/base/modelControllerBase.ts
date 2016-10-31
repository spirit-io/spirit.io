import { _ } from 'streamline-runtime';
import { Request, Response } from "express";
import {
    IModelController,
    IModelActions,
    IModelFactory,
    IQueryParameters,
    IReadParameters,
    ISaveParameters
} from '../interfaces';

export abstract class ModelControllerBase implements IModelController {

    constructor(private modelFactory: IModelFactory) { }

    query = (req: Request, res: Response, _: _): void => {
        let where: string = req.query['where'];
        if (where) {
            try {
                where = JSON.parse(where)
            } catch (err) {
                throw new Error(`Invalid where filter: ${where}`);
            }
        }
        let includes: string = req.query['includes'];
        let queryParams: IQueryParameters = { includes: includes };
        let result = this.modelFactory.helper.fetchInstances(_, where, queryParams, true);

        //let result = this.modelFactory.actions.query(_, where, { includes: includes });
        res.json(result);
    }

    read = (req: Request, res: Response, _: _): void => {
        let _id: string = req.params['_id'];
        let _ref: string = req.params['_ref'];
        let includes: string = req.query['includes'];

        let readOptions: IReadParameters = _ref ? {} : { includes: includes, ref: _ref };
        let result = this.modelFactory.helper.fetchInstance(_, _id, readOptions, true);

        //let result = this.modelFactory.actions.read(_, _id, readOptions);
        if (!result) {
            res.sendStatus(404);
        } else {
            res.json(result);
        }
    }

    create = (req: Request, res: Response, _: _): void => {
        let item: any = req['body'];
        let inst = new this.modelFactory.targetClass.prototype.constructor();
        this.modelFactory.helper.saveInstance(_, inst, item);
        let result = this.modelFactory.helper.serialize(inst, { ignoreNull: true });

        // let result = this.modelFactory.actions.create(_, item);
        res.status(201).json(result);
    }

    update = (req: Request, res: Response, _: _): void => {
        let _id: string = req.params['_id'];
        let _ref: string = req.params['_ref'];
        let item: any = req['body'];
        let params: ISaveParameters;
        if (_ref) {
            let data = {};
            data[_ref] = item;
            params = { ref: _ref, deleteMissing: true };
            let inst = this.modelFactory.helper.fetchInstance(_, _id, { ref: _ref });
            let result = this.modelFactory.helper.saveInstance(_, inst, data, params, true);

            //let result = this.modelFactory.actions.update(_, _id, data, params);
            res.json(result);
        } else {
            params = { deleteMissing: true };
            let inst = this.modelFactory.helper.fetchInstance(_, _id);
            let result = this.modelFactory.helper.saveInstance(_, inst, item, params, true);

            //let result = this.modelFactory.actions.update(_, _id, item, params);
            res.json(result);
        }
    }

    patch = (req: Request, res: Response, _: _): void => {
        let _id: string = req.params['_id'];
        let _ref: string = req.params['_ref'];
        let item: any = req['body'];

        if (_ref) {
            let data = {};
            data[_ref] = item;
            let result = this.modelFactory.actions.update(_, _id, data, { reference: _ref });
            res.json(result);
        } else {
            let result = this.modelFactory.actions.update(_, _id, item);
            res.json(result);
        }
    }

    delete = (req: Request, res: Response, _: _): void => {
        let _id: string = req.params['_id'];
        let result = this.modelFactory.actions.delete(_, _id);
        res.json(result);
    }

    executeService = (req: Request, res: Response, _: _): void => {
        let _name: string = req.params['_name'];
        if (this.modelFactory.$statics.indexOf(_name) === -1 || !this.modelFactory.targetClass[_name]) {
            res.sendStatus(404);
            return;
        }
        let result = this.modelFactory.targetClass[_name]();
        res.json(result);
    }

    executeMethod = (req: Request, res: Response, _: _): void => {
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