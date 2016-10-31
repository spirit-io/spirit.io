import { _ } from 'streamline-runtime';
import { helper as objectHelper } from '../utils';
import { IModelFactory } from '../interfaces';
import { ModelRegistry } from '../core/modelRegistry'
import { ConnectorHelper } from '../core/connectorHelper';

exports.initFactory = function (target: any) {
    target._collectionName = target._collectionName || target.toString().match(/\w+/g)[1];
    target.__factory__ = target.__factory__ || {};
    target.__factory__.$prototype = target.__factory__.$prototype || {};
    target.__factory__.$properties = target.__factory__.$properties || [];
    target.__factory__.$plurals = target.__factory__.$plurals || [];
    target.__factory__.$statics = target.__factory__.$statics || [];
    target.__factory__.$methods = target.__factory__.$methods || [];
    target.__factory__.$references = target.__factory__.$references || {};
    return target.__factory__;
};

export function addMetadata(target: any, key: string, meta: any, options?: any) {
    //console.log("Add metadata: ",key);
    options = options || {};
    // Get model factory
    let factory = exports.initFactory(target);

    // registerIn is used for standard meta _id, _createdAt and _updatedAt
    if (options.registerIn) {
        factory[options.registerIn].push(key);
    }

    // registerReverse is used to save reverse references property names
    if (options.registerReverse) {
        factory.$references[key] = { $reverse: options.registerReverse }
    }

    // add field to $prototype
    // Note: the $prototype is post processed by the schema compiler !!!
    if (meta) {
        if (factory.$prototype[key]) {
            objectHelper.merge(meta, factory.$prototype[key]);
        } else {
            factory.$prototype[key] = meta;
        }
    }
    return target;
}