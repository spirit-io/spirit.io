import { Request, Response, NextFunction } from "express";
import { IModelController, IModelFactory } from '../interfaces';
import { run } from 'f-promise';
import { Seneca } from '../core';

export class Controller implements IModelController {

    constructor(private modelFactory: IModelFactory) { }

    query = (req: Request, res: Response, next: NextFunction): void => {
        run(() => {
            let result = Seneca.act(`model:${this.modelFactory.collectionName},action:query`, {
                where: req.query['where'],
                includes: req.query['includes']
            });
            res.json(result);
            next();
        }).catch(e => {
            next(e);
        });
    }

    read = (req: Request, res: Response, next: NextFunction): void => {
        run(() => {
            let result = Seneca.act(`model:${this.modelFactory.collectionName},action:read`, {
                id: req.params['_id'],
                ref: req.params['_ref'],
                includes: req.query['includes']
            });
            res.json(result);
            next();
        }).catch(e => {
            next(e);
        });
    }

    create = (req: Request, res: Response, next: NextFunction): void => {
        run(() => {
            let result = Seneca.act(`model:${this.modelFactory.collectionName},action:create`, {
                body: req['body']
            });
            res.status(201).json(result);
            next();
        }).catch(e => {
            next(e);
        });
    }

    update = (req: Request, res: Response, next: NextFunction): void => {
        run(() => {
            let result = Seneca.act(`model:${this.modelFactory.collectionName},action:update`, {
                id: req.params['_id'],
                ref: req.params['_ref'],
                body: req['body']
            });
            res.json(result);
            next();
        }).catch(e => {
            next(e);
        });
    }

    patch = (req: Request, res: Response, next: NextFunction): void => {
        run(() => {
            let result = Seneca.act(`model:${this.modelFactory.collectionName},action:patch`, {
                id: req.params['_id'],
                ref: req.params['_ref'],
                body: req['body']
            });
            res.json(result);
            next();
        }).catch(e => {
            next(e);
        });
    };

    remove = (req: Request, res: Response, next: NextFunction): void => {
        run(() => {
            let result = Seneca.act(`model:${this.modelFactory.collectionName},action:remove`, {
                id: req.params['_id']
            });
            res.status(204).json(result);
            next();
        }).catch(e => {
            next(e);
        });
    };

    executeMethod = (req: Request, res: Response, next: NextFunction): void => {
        run(() => {
            let result = Seneca.act(`model:${this.modelFactory.collectionName},action:execute`, {
                id: req.params['_id'],
                name: req.params['_name'],
                body: req.body
            });
            res.json(result);
            next();
        }).catch(e => {
            next(e);
        });
    };

    executeService = (req: Request, res: Response, next: NextFunction): void => {
        run(() => {
            let result = Seneca.act(`model:${this.modelFactory.collectionName},action:invoke`, {
                name: req.params['_name'],
                body: req.body
            });
            res.json(result);
            next();
        }).catch(e => {
            next(e);
        });
    };
} 