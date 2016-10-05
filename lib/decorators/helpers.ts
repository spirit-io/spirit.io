import { _ } from 'streamline-runtime';
import { helper as objectHelper } from '../utils';
import { IModelFactory } from '../interfaces';
import { ModelRegistry } from '../core/modelRegistry'

export function addMetadata(target: any, key: string, meta: any, options?: any) {
    //console.log("Add metadata: ",key);
    options = options || {};
    // Get model factory
    let modelFactory: IModelFactory = ModelRegistry.getbuildingFactory(target);

    // registerIn is used for standard meta _id, _createdAt and _updatedAt
    if (options.registerIn) {
        modelFactory[options.registerIn].push(key);
    }

    // registerReverse is used to save reverse references property names
    if (options.registerReverse) {
        modelFactory.$references[key] = {$reverse: options.registerReverse}
    }

    // add field to schemaDef
    // Note: the schemaDef is post processed by the schema compiler !!!
    if (meta) {
        if (modelFactory.schemaDef[key]) {
            objectHelper.merge(meta, modelFactory.schemaDef[key]);
        } else {
            modelFactory.schemaDef[key] = meta;
        }
    }
}