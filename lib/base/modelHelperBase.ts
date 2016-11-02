import { _ } from 'streamline-runtime';
import {
    IModelFactory,
    IModelHelper,
    IModelActions,
    IQueryParameters,
    IFetchOptions,
    ISaveParameters,
    ISerializeOptions
} from '../interfaces';
import { ModelRegistry } from '../core';

export abstract class ModelHelperBase implements IModelHelper {

    constructor(private modelFactory: IModelFactory) { }

    fetchInstances(_: _, filter?: any, parameters?: IQueryParameters, serializeOptions?: ISerializeOptions) {
        let instances: any = [];
        let docs = this.modelFactory.actions.query(_, filter, parameters);
        for (var doc of docs) {
            let inst = new this.modelFactory.targetClass.prototype.constructor();
            this.updateValues(inst, doc);
            instances.push(serializeOptions ? this.serialize(inst, serializeOptions) : inst);
        }
        return instances;
    }

    fetchInstance(_: _, _id: string, options?: IFetchOptions, serializeOptions?: ISerializeOptions) {
        let doc = this.modelFactory.actions.read(_, _id, options);
        if (!doc) return null;
        let inst;
        if (options && options.ref) {
            let refFactory = this.modelFactory.getModelFactoryByPath(options.ref);
            inst = new refFactory.targetClass.prototype.constructor();
            this.updateValues(inst, doc, { modelFactory: refFactory });
            if (serializeOptions) serializeOptions.modelFactory = refFactory;
        } else {
            inst = new this.modelFactory.targetClass.prototype.constructor();
            this.updateValues(inst, doc);
        }
        return serializeOptions ? this.serialize(inst, serializeOptions) : inst;
    }

    saveInstance(_: _, instance: any, data?: any, options?: ISaveParameters, serializeOptions?: ISerializeOptions) {
        options = options || {};
        if (data) this.updateValues(instance, data, { deleteMissing: options.deleteMissing || false });
        let serialized = this.serialize(instance, serializeOptions);
        let item = this.modelFactory.actions.createOrUpdate(_, instance._id, serialized, options);
        this.updateValues(instance, item, { deleteMissing: true });
        if (!serializeOptions) return instance;
        return this.serialize(instance, serializeOptions);
    }

    deleteInstance(_: _, instance: any): any {
        return this.modelFactory.actions.delete(_, instance._id);
    }

    serialize(instance: any, options?: ISerializeOptions): any {
        options = options || {};
        // consider correct modelFactory (for relation potentially)
        let mf = options.modelFactory || this.modelFactory;
        let item: any = {};
        for (let key of mf.$fields) {
            if (instance[key] !== undefined) {
                if (mf.$references.hasOwnProperty(key)) {
                    if (mf.$plurals.indexOf(key) !== -1) {
                        instance[key] = Array.isArray(instance[key]) ? instance[key] : [instance[key]];
                        item[key] = instance[key].map((inst) => {
                            return options.ignoreRef ? inst : inst._id;
                        });
                    } else {
                        item[key] = options.ignoreRef ? instance[key] : instance[key]._id;
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
        options = options || {};
        // consider correct modelFactory (for relation potentially)
        let mf = options.modelFactory || this.modelFactory;
        // update new values
        for (let key of Object.keys(item)) {
            if (mf.$fields.indexOf(key) !== -1) {
                instance[key] = item[key];
            } else {
                throw new Error(`Property '${key}' does not exist on model '${mf.collectionName}'`);
            }
        }
        if (options.deleteMissing) {
            // reinitialize deleted values
            for (let key of mf.$fields) {
                if (key[0] !== '_' && item[key] === undefined) {
                    instance[key] = undefined;
                }
            }
        }

    }

    getMetadata(instance: any, metadataName: string): any {
        return instance[metadataName];
    }
}