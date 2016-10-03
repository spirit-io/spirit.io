import { _ } from 'streamline-runtime';
import { helper as objectHelper } from '../utils';
import { IModelFactory } from '../interfaces';
import { ModelRegistry } from '../core/modelRegistry'

export function addMetadata(target: any, key: string, meta: any, options?: any) {
    options = options || {};
    if (!target._collectionName) target._collectionName = getClassName(target).toLowerCase();
    // Get model factory
    let modelFactory: IModelFactory = ModelRegistry.get(target);

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

export function getClassName(target: any) {
    let regex = /^function ([^ (){]{1,})/;
    let res = (regex).exec(target.toString());
    return (res && res.length > 1) ? res[1] : null;
}