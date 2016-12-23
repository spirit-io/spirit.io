import { Request, Response, NextFunction } from "express";
import { IModelController, IModelFactory, IParameters } from '../interfaces';
import { HttpError } from '../common';
import { run } from 'f-promise';

export abstract class ModelControllerBase implements IModelController {

    constructor(private modelFactory: IModelFactory) { }

    query = (req: Request, res: Response, next: NextFunction): void => {
        run(() => {
            let where: string = req.query['where'];
            if (where) {
                try {
                    where = JSON.parse(where)
                } catch (err) {
                    throw new Error(`Invalid where filter: ${where}`);
                }
            }

            let includes: string = req.query['includes'];
            let queryParams: IParameters = { includes: includes };
            let result = this.modelFactory.helper.fetchInstances(where, queryParams, { serializeRef: true });
            res.json(result);
            next();

        }).catch(e => {
            next(e);
        });
    }

    read = (req: Request, res: Response, next: NextFunction): void => {
        run(() => {
            let _id: string = req.params['_id'];
            let _ref: string = req.params['_ref'];
            let includes: string = req.query['includes'];
            let fetchOpt: IParameters = _ref ? { includes: includes, ref: _ref } : {};
            let result = this.modelFactory.helper.fetchInstance(_id, fetchOpt, { serializeRef: true });
            if (!result) {
                throw new HttpError(404, "resource not found");
            } else {
                res.json(result);
            }
            next();
        }).catch(e => {
            next(e);
        });
    }

    create = (req: Request, res: Response, next: NextFunction): void => {
        run(() => {
            let item: any = req['body'];
            let inst = new this.modelFactory.targetClass.prototype.constructor();
            let result = this.modelFactory.helper.saveInstance(inst, item, null, { serializeRef: true });
            res.status(201).json(result);
            next();
        }).catch(e => {
            next(e);
        });
    }

    private _update = (params: IParameters = {}, req: Request, res: Response): void => {
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
        let inst = this.modelFactory.helper.fetchInstance(_id, params);
        if (!inst) throw new HttpError(404, "resource not found");
        let result = this.modelFactory.helper.saveInstance(inst, data, params, { serializeRef: true });
        if (!_ref) {
            res.json(result);
        } else {
            res.json(result[_ref]);
        }
    }

    update = (req: Request, res: Response, next: NextFunction): void => {
        run(() => this._update({ deleteMissing: true }, req, res)).then(result => {
            next();
        }).catch(e => {
            next(e);
        });
    }

    patch = (req: Request, res: Response, next: NextFunction): void => {
        run(() => this._update(null, req, res)).then(result => {
            next();
        }).catch(e => {
            next(e);
        });
    };

    delete = (req: Request, res: Response, next: NextFunction): void => {
        run(() => {
            let _id: string = req.params['_id'];
            let inst = this.modelFactory.helper.fetchInstance(_id);
            if (!inst) throw new HttpError(404, "resource not found");
            let result = this.modelFactory.helper.deleteInstance(inst)
            //let result = this.modelFactory.actions.delete(_id);
            res.status(204).json(result);
            next();
        }).catch(e => {
            next(e);
        });
    };
} 