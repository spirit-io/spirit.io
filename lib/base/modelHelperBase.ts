import { _ } from 'streamline-runtime';
import {
    IModelFactory,
    IModelHelper,
    IModelActions,
    IQueryParameters,
    IReadParameters,
    ISaveParameters,
    ISerializeOptions
} from '../interfaces';
import { ModelRegistry } from '../core';

export abstract class ModelHelperBase implements IModelHelper {

    constructor(private modelFactory: IModelFactory) { }

    fetchInstances(_: _, filter?: any, parameters?: IQueryParameters, serialize?: boolean) {
        let instances: any = [];
        let docs = this.modelFactory.actions.query(_, filter, parameters);
        for (var doc of docs) {
            let inst = new this.modelFactory.targetClass.prototype.constructor();
            this.updateValues(inst, doc);
            instances.push(serialize ? this.serialize(inst, { ignoreNull: true }) : inst);
        }
        return instances;
    }

    fetchInstance(_: _, _id: string, options?: IReadParameters, serialize?: boolean) {
        let doc = this.modelFactory.actions.read(_, _id, options);
        if (!doc) return null;
        let inst = new this.modelFactory.targetClass.prototype.constructor();
        this.updateValues(inst, doc);
        return serialize ? this.serialize(inst, { ignoreNull: true }) : inst;
    }

    saveInstance(_: _, instance: any, data?: any, options?: ISaveParameters, serialize?: boolean) {
        if (data) this.updateValues(instance, data, { deleteMissing: false });
        let serialized = this.serialize(instance, { ignoreNull: true });
        let item = this.modelFactory.actions.createOrUpdate(_, instance._id, serialized, options);
        this.updateValues(instance, item, { deleteMissing: true });
        if (!serialize) return instance;
        return this.serialize(instance);
    }

    deleteInstance(_: _, instance: any): any {
        return this.modelFactory.actions.delete(_, instance._id);
    }

    serialize(instance: any, options?: ISerializeOptions): any {
        options = options || {};
        let item: any = {};
        for (let key of this.modelFactory.$fields) {
            if (instance[key] !== undefined) {
                if (this.modelFactory.$references.hasOwnProperty(key)) {
                    if (this.modelFactory.$plurals.indexOf(key) !== -1) {
                        instance[key] = Array.isArray(instance[key]) ? instance[key] : [instance[key]];
                        item[key] = instance[key].map((inst) => {
                            return inst._id;
                        });
                    } else {
                        item[key] = instance[key]._id;
                    }
                } else {
                    item[key] = instance[key];
                }
            }
            if (!options.ignoreNull) if (instance[key] === undefined) item[key] = undefined;
        }
        //console.log("Serialize:", item);
        return item;
    }

    updateValues(instance: any, item: any, options?: any): void {
        if (!instance || !item) return null;
        // update new values
        for (let key of Object.keys(item)) {
            if (this.modelFactory.$fields.indexOf(key) !== -1) {
                instance[key] = item[key];
            } else {
                throw new Error(`Property '${key}' does not exist on model '${this.modelFactory.collectionName}'`);
            }
        }
        if (options && options.deleteMissing) {
            // reinitialize deleted values
            for (let key of this.modelFactory.$fields) {
                if (item[key] === undefined) {
                    instance[key] = undefined;
                }
            }
        }

    }

    getMetadata(instance: any, metadataName: string): any {
        return instance[metadataName];
    }
}