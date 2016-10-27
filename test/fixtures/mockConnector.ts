import { _ } from 'streamline-runtime';
import { IConnector, IModelFactory, IModelHelper, IModelActions, IModelController } from '../../lib/interfaces'
import { ModelFactoryBase, ModelHelperBase, ModelControllerBase } from '../../lib/base'
import { helper as objectHelper } from '../../lib/utils'
import { Connection } from 'mongoose';
import express = require ('express');
const uuid = require('node-uuid');

function ensureId(item: any) {
    item._id = item._id || uuid.v4();
}

class MockActions implements IModelActions {

    private storage: any = {};
    constructor(private modelFactory: MockFactory) { }

    query (_: _, filter: Object = {}, options?: any) {
        let res = [];
        this.storage[this.modelFactory.collectionName] = this.storage[this.modelFactory.collectionName] || {};
        objectHelper.forEachKey(this.storage[this.modelFactory.collectionName], (id, doc) => {
            let filterMatch = true;
            let filterKeys = Object.keys(filter);
            for (let i = 0; i < filterKeys.length && filterMatch; i++) {
                let key = filterKeys[i];
                let value = filter[key];
                if (doc[key] !== value) filterMatch = false;
            }
            if (filterMatch) res.push(doc);
        });
        return res;
    }

    read (_: _, id: any, options?: any) {
        this.storage[this.modelFactory.collectionName] = this.storage[this.modelFactory.collectionName] || {};
        return this.storage[this.modelFactory.collectionName][id];
    }

    create (_: _, item: any) {
        ensureId(item);
        item._createdAt = Date.now();
        return this.update(_, item._id, item);
    }

    update (_: _, _id: any, item: any, options?: any) {
        item._updatedAt = Date.now();
        this.storage[this.modelFactory.collectionName] = this.storage[this.modelFactory.collectionName] || {};
        this.storage[this.modelFactory.collectionName][_id] = item;
        return item;
    }

    createOrUpdate (_: _, _id: any, item: any, options?: any) {
        return this.create(_, item);
    };

    delete (_: _, _id: any) {
        this.storage[this.modelFactory.collectionName] = this.storage[this.modelFactory.collectionName] || {};
        delete this.storage[this.modelFactory.collectionName][_id];
    }

    getStorageLocation (id) {
        this.storage[this.modelFactory.collectionName] = this.storage[this.modelFactory.collectionName] || {};
        return this.storage[this.modelFactory.collectionName][id];
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

class MockFactory extends ModelFactoryBase implements IModelFactory{
    public schema: any;
    public model: any;

    constructor(targetClass: any) {
        super(targetClass);
    }

    setup (routers: Map<string, express.Router>) {
        super.setup(routers, new MockActions(this), new MockHelper(this), new MockController(this));
    }
}

export class MockConnector implements IConnector {
    private _datasource: string = 'mongodb';
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

    connect (datasourceKey: string, parameters: any): any  {}

    createModelFactory (myClass: any): IModelFactory  {
        return new MockFactory(myClass);
    }
}