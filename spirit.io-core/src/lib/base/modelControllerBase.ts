import { run } from 'f-promise';
import { Request, Response, NextFunction } from 'express';

import { IModelController, IModelFactory, IParameters } from '../interfaces';
import { HttpError } from '../utils';

export abstract class ModelControllerBase implements IModelController {

    protected constructor(private modelFactory: IModelFactory) { }

    public query = (req: Request, res: Response, next: NextFunction): void => {
        run(() => {
            let where: string = req.query.where;
            if (where) {
                try {
                    where = JSON.parse(where);
                } catch (err) {
                    throw new Error(`Invalid where filter: ${where}`);
                }
            }

            const includes: string = req.query.includes;
            const queryParams: IParameters = { includes };
            const result = this.modelFactory.helper.fetchInstances(where, queryParams, { serializeRef: true });
            res.json(result);
            next();

        }).catch((e) => {
            next(e);
        });
    };

    public read = (req: Request, res: Response, next: NextFunction): void => {
        run(() => {
            const _id: string = req.params._id;
            const _ref: string = req.params._ref;
            const includes: string = req.query.includes;
            const fetchOpt: IParameters = _ref ? { includes, ref: _ref } : {};
            const result = this.modelFactory.helper.fetchInstance(_id, fetchOpt, { serializeRef: true });
            if (!result) {
                throw new HttpError(404, 'resource not found');
            } else {
                res.json(result);
            }
            next();
        }).catch((e) => {
            next(e);
        });
    };

    public create = (req: Request, res: Response, next: NextFunction): void => {
        run(() => {
            const item: any = req.body;
            const inst = new this.modelFactory.targetClass.prototype.constructor();
            const result = this.modelFactory.helper.saveInstance(inst, item, undefined, { serializeRef: true });
            res.status(201).json(result);
            next();
        }).catch((e) => {
            next(e);
        });
    };

    public update = (req: Request, res: Response, next: NextFunction): void => {
        run(() => this._update({ deleteMissing: true }, req, res)).then((result) => {
            next();
        }).catch((e) => {
            next(e);
        });
    };

    public patch = (req: Request, res: Response, next: NextFunction): void => {
        run(() => this._update(undefined, req, res)).then((result) => {
            next();
        }).catch((e) => {
            next(e);
        });
    };

    public delete = (req: Request, res: Response, next: NextFunction): void => {
        run(() => {
            const _id: string = req.params._id;
            const inst = this.modelFactory.helper.fetchInstance(_id);
            if (!inst) throw new HttpError(404, 'resource not found');
            const result = this.modelFactory.helper.deleteInstance(inst);
            // let result = this.modelFactory.actions.delete(_id);
            res.status(204).json(result);
            next();
        }).catch((e) => {
            next(e);
        });
    };

    private _update = (params: IParameters = {}, req: Request, res: Response): void => {
        const _id: string = req.params._id;
        const _ref: string = req.params._ref;
        const item: any = req.body;

        let data;
        if (!_ref) {
            data = item;
        } else {
            // TODO: Ref update should be callable only for children
            data = {};
            data[_ref] = item;
            params.ref = _ref;
        }
        const inst = this.modelFactory.helper.fetchInstance(_id, params);
        if (!inst) throw new HttpError(404, 'resource not found');
        const result = this.modelFactory.helper.saveInstance(inst, data, params, { serializeRef: true });
        if (!_ref) {
            res.json(result);
        } else {
            res.json(result[_ref]);
        }
    };
}
