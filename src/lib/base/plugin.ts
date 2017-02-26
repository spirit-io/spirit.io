import { Router } from 'express';
import { Registry } from '../core';
import { IModelFactory, IParameters, IRoute } from '../interfaces';
import { HttpError } from '../utils';
import { run } from 'f-promise';

// Seneca plugin for ORM
export function orm(options: any) {
    function query(msg: any, done: Function): void {
        run(() => {
            let where: string = msg.where;
            if (where) {
                try {
                    where = JSON.parse(where)
                } catch (err) {
                    throw new HttpError(400, `Invalid where filter: ${where}`);
                }
            }

            let includes: string = msg.includes;
            let queryParams: IParameters = { includes: includes };
            let result = this.helper.fetchInstances(where, queryParams, { serializeRef: true });
            done(result);

        }).catch(e => {
            done(e);
        });
    }

    function read(msg: any, done: Function): void {
        run(() => {
            let _id: string = msg.id;
            let _ref: string = msg.ref;
            let includes: string = msg.includes;
            let fetchOpt: IParameters = _ref ? { includes: includes, ref: _ref } : {};
            let result = this.helper.fetchInstance(_id, fetchOpt, { serializeRef: true });
            if (!result) {
                throw new HttpError(404, "resource not found");
            } else {
                done(result);
            }

        }).catch(e => {
            done(e);
        });
    }

    function create(msg: any, done: Function): void {
        run(() => {
            let item: any = msg.body;
            let inst = new this.targetClass.prototype.constructor();
            let result = this.helper.saveInstance(inst, item, null, { serializeRef: true });
            done(result);
        }).catch(e => {
            done(e);
        });
    }

    function _update(factory: IModelFactory, params: IParameters = {}, msg: any, done: Function): void {
        run(() => {
            let _id: string = msg.id;
            let _ref: string = msg.ref;
            let item: any = msg.body;

            let data;
            if (!_ref) {
                data = item;
            } else {
                // TODO: Ref update should be callable only for children
                data = {};
                data[_ref] = item;
                params.ref = _ref;
            }
            let inst = factory.helper.fetchInstance(_id, params);
            if (!inst) throw new HttpError(404, "resource not found");
            let result = factory.helper.saveInstance(inst, data, params, { serializeRef: true });
            if (!_ref) {
                done(result);
            } else {
                done(result[_ref]);
            }

        }).catch(e => {
            done(e);
        });
    }

    function update(msg: any, done: Function): void {
        _update(this, { deleteMissing: true }, msg, done);
    }

    function patch(msg: any, done: Function): void {
        _update(this, null, msg, done);
    };

    function remove(msg: any, done: Function): void {
        run(() => {
            let _id: string = msg.id;
            let inst = this.helper.fetchInstance(_id);
            if (!inst) throw new HttpError(404, "resource not found");
            let result = this.helper.deleteInstance(inst)
            done(result);
        }).catch(e => {
            done(e);
        });
    };

    function executeService(msg: any, done: Function): void {
        run(() => {
            let _name: string = msg.name;
            if (this.$statics.indexOf(_name) === -1 || !this.targetClass[_name]) {
                throw new HttpError(400, `Service '${msg.name}' does not exist on model '${this.collectionName}'`);
            }
            let result = this.targetClass[_name](msg.body);
            done(result);
        }).catch(e => {
            done(e);
        });
    }

    function executeMethod(msg: any, done: Function): void {
        run(() => {
            let _id: string = msg.id;
            let _name: string = msg.name;
            let inst = this.helper.fetchInstance(_id);
            if (!inst) throw new HttpError(400, `Instance not found`);
            if (this.$methods.indexOf(_name) === -1 || !inst[_name]) {
                throw new HttpError(400, `Method '${msg.name}' does not exist on model '${this.collectionName}'`);
            }
            let result = inst[_name](msg.body);
            done(result);
        }).catch(e => {
            done(e);
        });
    }


    function setupRoutes() {
        // Do not register any route for linked factory
        if (factory.linkedFactory) return;

        let routeName = factory.collectionName.substring(0, 1).toLowerCase() + factory.collectionName.substring(1);
        let v1: Router = Registry.getApiRouter('v1');

        if (factory.persistent) {
            if (factory.actions) {
                // handle main requests
                v1.get(`/${routeName}`, factory.controller.query);
                v1.get(`/${routeName}/:_id`, factory.controller.read);
                v1.post(`/${routeName}`, factory.controller.create);
                v1.put(`/${routeName}/:_id`, factory.controller.update);
                v1.patch(`/${routeName}/:_id`, factory.controller.patch);
                v1.delete(`/${routeName}/:_id`, factory.controller.delete);
                // handle references requests
                v1.get(`/${routeName}/:_id/:_ref`, factory.controller.read);
                v1.put(`/${routeName}/:_id/:_ref`, factory.controller.update);
                v1.patch(`/${routeName}/:_id/:_ref`, factory.controller.patch);
            }

            // handle instance functions
            v1.post(`/${routeName}/:_id/([\$])execute/:_name`, factory.controller.executeMethod.bind(this) as any);
        }

        // handle static functions (available also on non persistent classes)
        v1.post(`/${routeName}/([\$])service/:_name`, factory.controller.executeService.bind(this) as any);
        factory.$routes.forEach((route: IRoute) => {
            let path = `/${routeName}${route.path}`;
            v1[route.method](path, route.fn);
        });
    }


    let factory: IModelFactory = options.factory;

    if (factory.persistent) {
        this.add({ orm: factory.collectionName, action: 'query' }, query.bind(factory));
        this.add({ orm: factory.collectionName, action: 'read' }, read.bind(factory));
        this.add({ orm: factory.collectionName, action: 'create' }, create.bind(factory));
        this.add({ orm: factory.collectionName, action: 'update' }, update.bind(factory));
        this.add({ orm: factory.collectionName, action: 'patch' }, patch.bind(factory));
        this.add({ orm: factory.collectionName, action: 'delete' }, remove.bind(factory));
        this.add({ orm: factory.collectionName, action: 'execute' }, executeMethod.bind(factory));
        this.add({ orm: factory.collectionName, action: 'invoke' }, executeService.bind(factory));
    }

    setupRoutes();

    return `ORM:${factory.collectionName}`;
}

