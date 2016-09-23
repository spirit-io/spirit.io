import { _ } from 'streamline-runtime';
import { helper as objectHelper } from '../utils/object';
import { IModelFactory } from '../interfaces';
import { ModelRegistry } from '../core/modelRegistry'

export function getFieldDecorator (options: any): any {
    function fieldDecorator(target: Symbol, propertyKey: string): any {
        addMetadata(target.constructor, propertyKey, options);
    }
    return fieldDecorator;
}

export function addMetadata(target: any, key: string, meta: any, force?: boolean) {
    if (!target._collectionName) target._collectionName = getClassName(target).toLowerCase()
    // Get model factory
    let modelFactory: IModelFactory = ModelRegistry.get(target);
    // store properties names
    modelFactory.properties.push(key);
    
    // add field to schemaDef
    // Note: the schemaDef is post processed by the schema compiler !!!
    if (modelFactory.schemaDef[key]) {
        objectHelper.merge(meta, modelFactory.schemaDef[key]);
    } else {
        modelFactory.schemaDef[key] = meta;
    }
}

export function getClassName(target: any) {
    let regex = /^function ([^ (){]{1,})/;
    let res = (regex).exec(target.toString());
    return (res && res.length > 1) ? res[1] : null;
}