import { _ } from 'streamline-runtime';
import { helper as objectHelper } from '../utils';
import { IModelFactory } from '../interfaces';
import { ModelRegistry } from '../core/modelRegistry'
import { ConnectorHelper } from '../core/connectorHelper';

exports.initFactory = function (target: any) {
    let fName = target.toString().match(/\w+/g)[1];
    target.__factory__ = target.__factory__ || {};
    let tempFactory = target.__factory__[fName];
    if (!target._collectionName || target._collectionName !== fName) {
        target._collectionName = fName;
        tempFactory = target.__factory__[fName] = {};
    }
    if (target.datasource) {
        tempFactory.datasource = target.datasource;
    }
    tempFactory.$prototype = tempFactory.$prototype || {};
    tempFactory.$properties = tempFactory.$properties || [];
    tempFactory.$plurals = tempFactory.$plurals || [];
    tempFactory.$statics = tempFactory.$statics || [];
    tempFactory.$methods = tempFactory.$methods || [];
    tempFactory.$routes = tempFactory.$routes || [];
    tempFactory.$references = tempFactory.$references || {};
    tempFactory.$hooks = tempFactory.$hooks || new Map();
    return tempFactory;
};

export function addMetadata(target: any, key: string, meta: any, options?: any) {
    //console.log("Add metadata: ", key);
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

export function addHook(target: Symbol, propertyKey: string, name: string) {
    // Get model factory
    let factory: IModelFactory = exports.initFactory(target);
    // Set hook
    factory.$hooks.set(name, target[propertyKey]);
    return target;
}

export function addRoute(target: Symbol, propertyKey: string, method: string, path: string) {
    // Get model factory
    let factory: IModelFactory = exports.initFactory(target.constructor);
    // Set hook
    factory.$routes.push({
        method: method,
        path: path,
        fn: target[propertyKey]
    });
    return target;
}