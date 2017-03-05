import { Request, Response, NextFunction } from "express";
import { IModelController, IModelFactory, IRoute } from '../interfaces';
import { run } from 'f-promise';
import { Router } from 'express';
import { Service, Registry } from '../core';

export class Controller implements IModelController {

    constructor(private modelFactory: IModelFactory) {

    }

    query = (req: Request, res: Response, next: NextFunction): void => {
        run(() => {
            let result = Service.act(`model:${this.modelFactory.collectionName},action:query`, {
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
            let result = Service.act(`model:${this.modelFactory.collectionName},action:read`, {
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
            let result = Service.act(`model:${this.modelFactory.collectionName},action:create`, {
                params: req['body']
            });
            res.status(201).json(result);
            next();
        }).catch(e => {
            next(e);
        });
    }

    update = (req: Request, res: Response, next: NextFunction): void => {
        run(() => {
            let result = Service.act(`model:${this.modelFactory.collectionName},action:update`, {
                id: req.params['_id'],
                ref: req.params['_ref'],
                params: req['body']
            });
            res.json(result);
            next();
        }).catch(e => {
            next(e);
        });
    }

    patch = (req: Request, res: Response, next: NextFunction): void => {
        run(() => {
            let result = Service.act(`model:${this.modelFactory.collectionName},action:patch`, {
                id: req.params['_id'],
                ref: req.params['_ref'],
                params: req['body']
            });
            res.json(result);
            next();
        }).catch(e => {
            next(e);
        });
    };

    remove = (req: Request, res: Response, next: NextFunction): void => {
        run(() => {
            let result = Service.act(`model:${this.modelFactory.collectionName},action:remove`, {
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
            let result = Service.act(`model:${this.modelFactory.collectionName},action:execute`, {
                id: req.params['_id'],
                name: req.params['_name'],
                params: req.body
            });
            res.json(result);
            next();
        }).catch(e => {
            next(e);
        });
    };

    executeService = (req: Request, res: Response, next: NextFunction): void => {
        run(() => {
            let result = Service.act(`model:${this.modelFactory.collectionName},action:invoke`, {
                name: req.params['_name'],
                params: req.body
            });
            res.json(result);
            next();
        }).catch(e => {
            next(e);
        });
    };

    executeRequest(fn: Function) {
        let factory = this.modelFactory;
        return function (req: Request, res: Response, next: NextFunction) {
            run(() => {
                let params: any = {
                    params: req.params,
                    query: req.query,
                    body: req.body,
                    req$: req,
                    res$: res,
                    next$: next,
                    fn: fn
                }
                let result = Service.act(`model:${factory.collectionName},action:request`, params);
                if (!res.headersSent) res.json(result);
                next();
            }).catch(e => {
                next(e);
            });
        };
    }

    setupRoutes(): void {
        // Do not register any route for linked factory
        if (this.modelFactory.linkedFactory) return;

        let routeName = this.modelFactory.collectionName.substring(0, 1).toLowerCase() + this.modelFactory.collectionName.substring(1);
        let v1: Router = Registry.getApiRouter('v1');

        if (this.modelFactory.persistent) {
            if (this.modelFactory.actions) {
                // handle main requests
                v1.get(`/${routeName}`, this.query);
                v1.get(`/${routeName}/:_id`, this.read);
                v1.post(`/${routeName}`, this.create);
                v1.put(`/${routeName}/:_id`, this.update);
                v1.patch(`/${routeName}/:_id`, this.patch);
                v1.delete(`/${routeName}/:_id`, this.remove);
                // handle references requests
                v1.get(`/${routeName}/:_id/:_ref`, this.read);
                v1.put(`/${routeName}/:_id/:_ref`, this.update);
                v1.patch(`/${routeName}/:_id/:_ref`, this.patch);
            }

            // handle instance functions
            v1.post(`/${routeName}/:_id/([\$])execute/:_name`, this.executeMethod.bind(this) as any);
        }

        // handle static functions (available also on non persistent classes)
        v1.post(`/${routeName}/([\$])service/:_name`, this.executeService.bind(this) as any);

        // register special routes
        this.modelFactory.$routes.forEach((route: IRoute) => {
            let path = `/${routeName}${route.path}`;
            v1[route.method](path, this.executeRequest(route.fn));
        });
    }

} 