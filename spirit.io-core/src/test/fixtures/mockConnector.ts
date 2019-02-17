import { IConnector, IModelFactory, IModelHelper, IModelActions, IModelController, IParameters, IValidator } from '../../lib/interfaces';
import { ModelFactoryBase, ModelHelperBase, ModelControllerBase } from '../../lib/base';
import { helper as objectHelper } from '../../lib/utils';
const uuid = require('uuid');

function ensureId(item: any) {
    item._id = item._id || uuid.v4();
}

let storage: any = {};

class MockActions implements IModelActions {

    constructor(private modelFactory: MockFactory) { }

    public query(filter: Object = {}, parameters?: IParameters) {
        const res: any[] = [];
        storage[this.modelFactory.collectionName] = storage[this.modelFactory.collectionName] || {};

        const data = objectHelper.clone(storage[this.modelFactory.collectionName], true);
        const keys = Object.keys(data);

        keys.forEach((k) => {
            const doc = data[k];
            let filterMatch = true;
            const filterKeys = Object.keys(filter);
            for (let i = 0; i < filterKeys.length && filterMatch; i++) {
                const key = filterKeys[i];
                const value = filter[key];
                if (doc[key] !== value) filterMatch = false;
            }
            if (filterMatch) {
                this._populate(doc, parameters);
                res.push(doc);
            }
        });
        return res;
    }

    public read(id: any, parameters?: IParameters) {
        // console.log(`Read ${this.modelFactory.collectionName}: id: ${id} ; options: ${JSON.stringify(options, null, 2)}`);
        storage[this.modelFactory.collectionName] = storage[this.modelFactory.collectionName] || {};
        const res = objectHelper.clone(storage[this.modelFactory.collectionName][id], true);
        if (parameters && parameters.ref) {
            const refModelFactory: IModelFactory = this.modelFactory.getModelFactoryByPath(parameters.ref);

            if (this.modelFactory.$plurals.indexOf(parameters.ref) !== -1) {
                const all = refModelFactory.actions.query();
                return all.filter((elt) => {
                    return res[parameters.ref as any].indexOf(elt._id) !== -1;
                });
            }
            return refModelFactory.actions.read(res[parameters.ref]);

        }
        this._populate(res, parameters);
        return res;

    }

    public create(item: any, options?: any) {
        ensureId(item);
        item._createdAt = new Date();
        return this.update(item._id, item, options);
    }

    public update(_id: any, item: any, options?: IParameters) {
        item._updatedAt = new Date();
        const storedItem = this.modelFactory.simplifyReferences(item);
        storedItem._id = _id;
        storage[this.modelFactory.collectionName] = storage[this.modelFactory.collectionName] || {};
        if (options && options.ref) {
            const key = options.ref;
            if (this.modelFactory.$fields.has(key)) {
                storage[this.modelFactory.collectionName][_id] = storage[this.modelFactory.collectionName][_id] || {};
                storage[this.modelFactory.collectionName][_id][key] = storedItem;
            }
        } else {
            storage[this.modelFactory.collectionName][_id] = storedItem;
        }
        return item;
    }

    public delete(_id: any) {
        storage[this.modelFactory.collectionName] = storage[this.modelFactory.collectionName] || {};
        delete storage[this.modelFactory.collectionName][_id];
    }

    private _populate(item: any, parameters: IParameters = {}) {
        Object.keys(this.modelFactory.$references).forEach((key) => {
            this.modelFactory.populateField(parameters, item, key);
        });
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
    constructor(name: string, targetClass: any, connector: IConnector, options?: any) {
        super(name, targetClass, connector, options);
    }

    public setup() {
        super.init(new MockActions(this), new MockHelper(this), new MockController(this));
    }

}

export class MockConnector implements IConnector {

    get datasource(): string {
        return this._datasource;
    }

    set config(config: any) {
        this._config = config || {};
    }
    get config() {
        return this._config;
    }
    public connections: Map<string, any>;
    public validators: Map<string, IValidator> = new Map();
    private _datasource: string = 'mock';
    private _config: any;

    constructor(config: any) {
        this.config = config;
    }

    public connect(datasourceKey: string): any {
        // noop
    }
    public getConnection(datasourceKey: string): any {
        return undefined;
    }
    public createModelFactory(name: string, myClass: any, options?: any): IModelFactory {
        return new MockFactory(name, myClass, this, options);
    }

    public cleanDb(ds: string): void {
        storage = {};
    }

    public dumpStorage() {
        return storage;
    }

    public registerValidator(validator: IValidator) {
        this.validators.set(validator.name, validator);
    }

    public getValidator(key: string): IValidator | undefined {
        return this.validators.get(key);
    }
}
