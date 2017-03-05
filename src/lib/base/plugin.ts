
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
            let item: any = msg.params;
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
            let item: any = msg.params;

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
                throw new HttpError(404, `Service '${msg.name}' does not exist on model '${this.collectionName}'`);
            }
            let result = this.targetClass[_name](msg.params);
            done(result);
        }).catch(e => {
            e.error = e.message;
            done(e);
        });
    }

    function executeMethod(msg: any, done: Function): void {
        run(() => {
            let _id: string = msg.id;
            let _name: string = msg.name;
            let inst = this.helper.fetchInstance(_id);
            if (!inst) throw new HttpError(404, `Instance not found`);
            if (this.$methods.indexOf(_name) === -1 || !inst[_name]) {
                throw new HttpError(404, `Method '${msg.name}' does not exist on model '${this.collectionName}'`);
            }
            let result = inst[_name](msg.params);
            done(result);
        }).catch(e => {
            e.error = e.message;
            done(e);
        });
    }

    function executeRequest(msg: any, done: Function): void {
        run(() => {
            let fn: Function = msg.fn;
            let result = fn.call(this, {
                query: msg.query,
                params: msg.params,
                body: msg.body,
                req$: msg.req$,
                res$: msg.res$,
                next$: msg.next$
            });
            done(result);
        }).catch(e => {
            e.error = e.message;
            done(e);
        });
    }


    let factory: IModelFactory = options.factory;

    if (factory.persistent) {
        this.add({ model: factory.collectionName, action: 'query' }, query.bind(factory));
        this.add({ model: factory.collectionName, action: 'read' }, read.bind(factory));
        this.add({ model: factory.collectionName, action: 'create' }, create.bind(factory));
        this.add({ model: factory.collectionName, action: 'update' }, update.bind(factory));
        this.add({ model: factory.collectionName, action: 'patch' }, patch.bind(factory));
        this.add({ model: factory.collectionName, action: 'remove' }, remove.bind(factory));
        this.add({ model: factory.collectionName, action: 'execute' }, executeMethod.bind(factory));
    }
    this.add({ model: factory.collectionName, action: 'invoke' }, executeService.bind(factory));

    // register special routes
    factory.$routes.forEach((route: IRoute) => {
        this.add({ model: factory.collectionName, action: 'request' }, executeRequest.bind(factory));

    });

    return `model:${factory.collectionName}`;
}

