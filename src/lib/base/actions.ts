import { IModelFactory, IModelActions, IParameters } from '../interfaces';
import { wait } from 'f-promise';
import { Seneca } from '../core';
import * as bluebird from "bluebird";
/*

const uuid = require('uuid');

function ensureId(item: any) {
    item.id = item.id || uuid.v4();
}
*/
export class Actions implements IModelActions {

    constructor(private modelFactory: IModelFactory) { }


    private _populate(item: any, parameters: IParameters) {
        parameters = parameters || {};
        Object.keys(this.modelFactory.$references).forEach((key) => {
            this.modelFactory.populateField(parameters, item, key);
        });
    }

    private makeEntity() {
        let entity = Seneca.instance.make(`${this.modelFactory.collectionName}`);
        entity.list$ = bluebird.promisify(entity.list$, { context: entity });
        entity.load$ = bluebird.promisify(entity.load$, { context: entity });
        entity.save$ = bluebird.promisify(entity.save$, { context: entity });
        entity.remove$ = bluebird.promisify(entity.remove$, { context: entity });
        return entity;
    }

    query(filter: Object = {}, options?: IParameters): any[] {
        options = options || {};
        let entity: any = this.makeEntity();
        let arr: any = wait(entity.list$(filter));

        let objects: any[] = arr.map((obj) => {
            let res = obj.data$(false);
            res.id = obj.data$().id;
            if (options.includes) this._populate(res, options);
            return res;
        });
        return objects;
    }

    read(filter: any, options?: IParameters): any {
        options = options || {};
        let entity: any = this.makeEntity();
        let inst: any = wait(entity.load$(filter));
        if (!inst) return null;
        let res: any = inst.data$(false);
        res.id = inst.data$().id;
        if (options.includes) this._populate(res, options);

        if (options.ref) {
            let refModelFactory = this.modelFactory.getModelFactoryByPath(options.ref);
            let field = this.modelFactory.$fields.get(options.ref);
            if (field.isPlural) {
                let keys = res[options.ref];
                return refModelFactory.actions.query(keys, { includes: options.includes });
            } else {
                return refModelFactory.actions.read(res[options.ref], { includes: options.includes });
            }
        } else {
            return res;
        }
    }

    create(item: any, options?: IParameters): any {
        // ensureId(item);
        item._createdAt = new Date();
        return this.update(item.id, item, options);
    }

    update(_id: any, item: any, options?: IParameters): any {
        options = options || {};
        item._updatedAt = new Date();
        let itemToStore = this.modelFactory.simplifyReferences(item);
        let entity: any = this.makeEntity();
        let inst: any = wait(entity.save$(itemToStore));
        if (options.includes) this._populate(itemToStore, options);
        item.id = inst.data$().id;
        return item;
    }

    delete(_id: any) {
        let entity: any = this.makeEntity();
        return wait(entity.remove$(_id));
    }
}