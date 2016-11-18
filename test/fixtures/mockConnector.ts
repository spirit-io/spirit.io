import { _ } from 'streamline-runtime';
import { IConnector, IModelFactory, IModelHelper, IModelActions, IModelController, ISaveParameters, IFetchParameters, IQueryParameters } from '../../lib/interfaces'
import { ModelFactoryBase, ModelHelperBase, ModelControllerBase } from '../../lib/base'
import { helper as objectHelper } from '../../lib/utils'
import { Connection } from 'mongoose';
import express = require('express');
const uuid = require('node-uuid');

function ensureId(item: any) {
    item._id = item._id || uuid.v4();
}

let storage: any = {};

class MockActions implements IModelActions {

    constructor(private modelFactory: MockFactory) { }


    private _populate(item: any, parameters: IFetchParameters | IQueryParameters) {
        function getRel(_type: string, _id: string) {
            return storage[_type] && storage[_type][_id];
        }

        parameters = parameters || {};
        Object.keys(this.modelFactory.$references).forEach((key) => {
            let incl = parameters.includes && parameters.includes.filter((i) => { return i.path === key; })[0];
            if (incl && item && item[key] != null) {
                let type = this.modelFactory.getReferenceType(key);
                let relValue;
                if (Array.isArray(item[key])) {
                    relValue = [];
                    item[key].forEach((id) => {
                        let ref = getRel(type, id);
                        if (incl.select) {
                            let data = { _id: ref._id };
                            data[incl.select] = ref[incl.select];
                            relValue.push(data);
                        } else {
                            relValue.push(ref);
                        }
                    });
                } else {
                    let ref = getRel(type, item[key]);
                    if (incl.select) {
                        let data = { _id: ref._id };
                        data[incl.select] = ref[incl.select];
                        relValue = data;
                    } else {
                        relValue = ref;
                    }
                }
                item[key] = relValue;
            }
        });
    }

    private _simplifyReferences(item: any) {
        let transformed = objectHelper.clone(item, true);
        Object.keys(this.modelFactory.$references).forEach((key) => {
            if (transformed && transformed[key] != null) {
                let relValue;
                if (Array.isArray(transformed[key])) {
                    relValue = [];
                    transformed[key].forEach((it) => {
                        if (typeof it === 'object' && it._id) relValue.push(it._id);
                        else relValue.push(it);
                    });
                } else {
                    if (typeof transformed[key] === 'object' && transformed[key]._id) relValue = transformed[key]._id;
                    else relValue = transformed[key];
                }
                transformed[key] = relValue;
            }
        });
        return transformed;
    }

    query(_: _, filter: Object = {}, parameters?: IQueryParameters) {
        let res = [];
        storage[this.modelFactory.collectionName] = storage[this.modelFactory.collectionName] || {};
        objectHelper.forEachKey(objectHelper.clone(storage[this.modelFactory.collectionName], true), (id, doc) => {
            let filterMatch = true;
            let filterKeys = Object.keys(filter);
            for (let i = 0; i < filterKeys.length && filterMatch; i++) {
                let key = filterKeys[i];
                let value = filter[key];
                if (doc[key] !== value) filterMatch = false;
            }
            if (filterMatch) {
                this._populate(doc, parameters);
                res.push(doc);
            }
        });
        return res;
    }

    read(_: _, id: any, parameters?: IFetchParameters) {
        //console.log(`Read ${this.modelFactory.collectionName}: id: ${id} ; options: ${JSON.stringify(options, null, 2)}`);
        storage[this.modelFactory.collectionName] = storage[this.modelFactory.collectionName] || {};
        let res = objectHelper.clone(storage[this.modelFactory.collectionName][id], true);
        if (parameters && parameters.ref) {
            let refRes: any;
            let refModelFactory: IModelFactory = this.modelFactory.getModelFactoryByPath(parameters.ref);

            if (this.modelFactory.$plurals.indexOf(parameters.ref) !== -1) {
                let ids = Array.isArray(res[parameters.ref]) ? res[parameters.ref] : [res[parameters.ref]];
                let all = refModelFactory.actions.query(_);
                return all.filter((elt) => {
                    return res[parameters.ref].indexOf(elt._id) !== -1;
                });
            } else {
                return refModelFactory.actions.read(_, res[parameters.ref]);
            }
        } else {
            this._populate(res, parameters);
            return res;
        }
    }

    create(_: _, item: any, options?: any) {
        ensureId(item);
        item._createdAt = new Date();
        return this.update(_, item._id, item, options);
    }

    update(_: _, _id: any, item: any, options?: ISaveParameters) {
        item._updatedAt = new Date();
        let storedItem = this._simplifyReferences(item);
        storedItem._id = _id;
        storage[this.modelFactory.collectionName] = storage[this.modelFactory.collectionName] || {};
        if (options && options.ref) {
            let key = options.ref;
            if (this.modelFactory.$fields.indexOf(key) !== -1) {
                storage[this.modelFactory.collectionName][_id] = storage[this.modelFactory.collectionName][_id] || {};
                storage[this.modelFactory.collectionName][_id][key] = storedItem;
            }
        } else {
            storage[this.modelFactory.collectionName][_id] = storedItem;
        }
        return item;
    }

    createOrUpdate(_: _, _id: any, item: any, options?: any) {
        // console.log("Create or update document with values;", item);
        let doc = this.read(_, _id);
        if (doc) {
            // console.log(`update ${_id}`);
            if (item.hasOwnProperty('_id')) delete item._id; // TODO: clean data _created, _updated...
            return this.update(_, _id, item, options);
        } else {
            // console.log(`create ${_id}`);
            return this.create(_, item, options);
        }
    };

    delete(_: _, _id: any) {
        storage[this.modelFactory.collectionName] = storage[this.modelFactory.collectionName] || {};
        delete storage[this.modelFactory.collectionName][_id];
    }
}

class MockHelper extends ModelHelperBase implements IModelHelper {
    constructor(modelFactory: IModelFactory) {
        super(modelFactory);
    }
}

class MockController extends ModelControllerBase implements IModelController {
    constructor(modelFactory: IModelFactory) {
        super(modelFactory);
    }
}

class MockFactory extends ModelFactoryBase implements IModelFactory {
    constructor(targetClass: any) {
        super(targetClass);
    }

    setup(routers: Map<string, express.Router>) {
        super.setup(routers, new MockActions(this), new MockHelper(this), new MockController(this));
    }
}

export class MockConnector implements IConnector {
    private _datasource: string = 'mock';
    private _config: any;

    get datasource(): string {
        return this._datasource;
    }

    set config(config: any) {
        this._config = config || {};
    }
    get config() {
        return this._config;
    }

    connect(datasourceKey: string, parameters: any): any { }

    createModelFactory(myClass: any): IModelFactory {
        return new MockFactory(myClass);
    }

    resetStorage(): any {
        storage = {};
    }

    dumpStorage() {
        return storage;
    }
}