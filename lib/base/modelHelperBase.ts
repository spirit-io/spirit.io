import { _ } from 'streamline-runtime';
import { IModelFactory, IModelHelper, IModelActions } from '../interfaces';
import { ModelRegistry } from '../core';

export abstract class ModelHelperBase implements IModelHelper {


    constructor(private modelFactory: IModelFactory) {}

    fetchInstances (_: _, filter?: any) {
        let instances: any = [];
        let docs = this.modelFactory.actions.query(_, filter);
        for (var doc of docs) {
            instances.push(this.serialize(new this.modelFactory.targetClass.prototype.constructor(doc), {ignoreNull: true}));
        }
        return instances;
    }

    fetchInstance (_:_, _id: any) {
        let doc = this.modelFactory.actions.read(_, _id);
        if (!doc) return;
        return this.serialize(new this.modelFactory.targetClass.prototype.constructor(doc), {ignoreNull: true});
    }

    saveInstance (_:_, instance: any, options?: any) {
        let item = this.modelFactory.actions.createOrUpdate(_, instance._id, this.serialize(instance, {ignoreNull: true}), options);
        this.updateValues(instance, item, {deleteMissing: true});
        if (options && options.returnInstance) return instance;
        return;
    }

    deleteInstance (_:_, instance: any): any {
        return this.modelFactory.actions.delete(_, instance._id);
    }

    serialize (instance: any, options?: any): any {
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
        //console.log("Serialize:",item);
        return item;
    }

    updateValues (instance: any, item: any, options?: any): void {
        if (!instance || !item) return;
        // update new values
        for (let key of Object.keys(item)) {
            if (this.modelFactory.$fields.indexOf(key) !== -1) {
                instance[key] = item[key];
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

    getMetadata (instance: any, metadataName: string): any {
        return instance[metadataName];
    }
}