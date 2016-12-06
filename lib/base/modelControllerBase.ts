import { _ } from 'streamline-runtime';
import { Request, Response } from "express";
import {
    IModelController,
    IModelActions,
    IModelFactory,
    IQueryParameters,
    IFetchParameters,
    ISaveParameters
} from '../interfaces';
import { HttpError } from '../common';

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
        let result = this.modelFactory.helper.fetchInstances(_, where, queryParams, { ignoreNull: true, serializeRef: true });
        //let result = this.modelFactory.actions.query(_, where, { includes: includes });
        res.json(result);
    }

    read = (req: Request, res: Response, _: _): void => {
        let _id: string = req.params['_id'];
        let _ref: string = req.params['_ref'];
        let includes: string = req.query['includes'];
        let fetchOpt: IFetchParameters = _ref ? { includes: includes, ref: _ref } : {};
        let result = this.modelFactory.helper.fetchInstance(_, _id, fetchOpt, { ignoreNull: true, serializeRef: true });

        //let result = this.modelFactory.actions.read(_, _id, readOptions);
        if (!result) {
            throw new HttpError(404, "resource not found");
        } else {
            res.json(result);
        }
    }

    create = (req: Request, res: Response, _: _): void => {
        let item: any = req['body'];
        let inst = new this.modelFactory.targetClass.prototype.constructor();
        let result = this.modelFactory.helper.saveInstance(_, inst, item, null, { ignoreNull: true, serializeRef: true });

        // let result = this.modelFactory.actions.create(_, item);
        res.status(201).json(result);
    }

    private _update = (_: _, params: ISaveParameters | IFetchParameters = {}, req: Request, res: Response): void => {
        let _id: string = req.params['_id'];
        let _ref: string = req.params['_ref'];
        let item: any = req['body'];

        let data;
        if (!_ref) {
            data = item;
        } else {
            // TODO: Ref update should be callable only for children
            data = {};
            data[_ref] = item;
            params.ref = _ref;
        }
        let inst = this.modelFactory.helper.fetchInstance(_, _id, params);
        if (!inst) throw new HttpError(404, "resource not found");
        let result = this.modelFactory.helper.saveInstance(_, inst, data, params, { ignoreNull: true, serializeRef: true });
        //let result = this.modelFactory.actions.update(_, _id, item, params);

        if (!_ref) {
            res.json(result);
        } else {
            res.json(result[_ref]);
        }

    }

    update = (req: Request, res: Response, _: _): void => {
        this._update(_, { deleteMissing: true }, req, res);
    }

    patch = (req: Request, res: Response, _: _): void => {
        this._update(_, null, req, res);
    }

    delete = (req: Request, res: Response, _: _): void => {
        let _id: string = req.params['_id'];
        let inst = this.modelFactory.helper.fetchInstance(_, _id);
        if (!inst) throw new HttpError(404, "resource not found");
        let result = this.modelFactory.helper.deleteInstance(_, inst);

        //let result = this.modelFactory.actions.delete(_, _id);
        res.status(204).json(result);
    }
} 