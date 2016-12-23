import { IConnector, IModelFactory, IModelHelper, IModelActions, IModelController, IParameters } from '../../lib/interfaces'
import { ModelFactoryBase, ModelHelperBase, ModelControllerBase } from '../../lib/base'
import { helper as objectHelper } from '../../lib/utils'
import express = require('express');
const uuid = require('uuid');

function ensureId(item: any) {
    item._id = item._id || uuid.v4();
}

let storage: any = {};

class MockActions implements IModelActions {

    constructor(private modelFactory: MockFactory) { }


    private _populate(item: any, parameters: IParameters) {
        parameters = parameters || {};
        Object.keys(this.modelFactory.$references).forEach((key) => {
            this.modelFactory.populateField(parameters, item, key);
        });
    }

    query(filter: Object = {}, parameters?: IParameters) {
        let res = [];
        storage[this.modelFactory.collectionName] = storage[this.modelFactory.collectionName] || {};

        let data = objectHelper.clone(storage[this.modelFactory.collectionName], true);
        let keys = Object.keys(data);

        keys.forEach((k) => {
            let doc = data[k];
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

    read(id: any, parameters?: IParameters) {
        //console.log(`Read ${this.modelFactory.collectionName}: id: ${id} ; options: ${JSON.stringify(options, null, 2)}`);
        storage[this.modelFactory.collectionName] = storage[this.modelFactory.collectionName] || {};
        let res = objectHelper.clone(storage[this.modelFactory.collectionName][id], true);
        if (parameters && parameters.ref) {
            let refModelFactory: IModelFactory = this.modelFactory.getModelFactoryByPath(parameters.ref);

            if (this.modelFactory.$plurals.indexOf(parameters.ref) !== -1) {
                let all = refModelFactory.actions.query();
                return all.filter((elt) => {
                    return res[parameters.ref].indexOf(elt._id) !== -1;
                });
            } else {
                return refModelFactory.actions.read(res[parameters.ref]);
            }
        } else {
            this._populate(res, parameters);
            return res;
        }
    }

    create(item: any, options?: any) {
        ensureId(item);
        item._createdAt = new Date();
        return this.update(item._id, item, options);
    }

    update(_id: any, item: any, options?: IParameters) {
        item._updatedAt = new Date();
        let storedItem = this.modelFactory.simplifyReferences(item);
        storedItem._id = _id;
        storage[this.modelFactory.collectionName] = storage[this.modelFactory.collectionName] || {};
        if (options && options.ref) {
            let key = options.ref;
            if (this.modelFactory.$fields.has(key)) {
                storage[this.modelFactory.collectionName][_id] = storage[this.modelFactory.collectionName][_id] || {};
                storage[this.modelFactory.collectionName][_id][key] = storedItem;
            }
        } else {
            storage[this.modelFactory.collectionName][_id] = storedItem;
        }
        return item;
    }

    delete(_id: any) {
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
    constructor(name: string, targetClass: any, connector: IConnector) {
        super(name, targetClass, connector);
    }

    setup(routers: Map<string, express.Router>) {
        super.init(routers, new MockActions(this), new MockHelper(this), new MockController(this));
    }

}

export class MockConnector implements IConnector {
    private _datasource: string = 'mock';
    private _config: any;
    public connections: Map<string, any>;
    constructor(config: any) {
        this.config = config;
    }

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
    getConnection(datasourceKey: string): any {
        return undefined;
    }
    createModelFactory(name: string, myClass: any): IModelFactory {
        return new MockFactory(name, myClass, this);
    }

    resetStorage(): any {
        storage = {};
    }

    dumpStorage() {
        return storage;
    }
}