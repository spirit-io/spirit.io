import { IReference } from '../interfaces';
import { helper as objectHelper } from '../utils/object';
const helpers = require('./helpers');

// !!!!!!!!!!!!!!!
// properties metadata have to be stored on class constructor
// !!!!!!!!!!!!!!!


export function unique(target: any, propertyKey: string | symbol) {
    helpers.addMetadata(target.constructor, propertyKey, { unique: true });
}

export function required(target: any, propertyKey: string) {
    helpers.addMetadata(target.constructor, propertyKey, { required: true });
}

export function index(target: any, propertyKey: string) {
    helpers.addMetadata(target.constructor, propertyKey, { index: true });
}

export function embedded(target: any, propertyKey: string) {
    helpers.addMetadata(target.constructor, propertyKey, { embedded: true });
}

export function readonly(target: any, propertyKey: string) {
    helpers.addMetadata(target.constructor, propertyKey, { readOnly: true });
}

export function invisible(value: boolean | Function): any {
    return function (target: Symbol, propertyKey: string): any {
        helpers.addMetadata(target.constructor, propertyKey, { invisible: value });
    }
}

export function reverse(refName: string): any {
    return function (target: Symbol, propertyKey: string): any {
        helpers.addMetadata(target.constructor, propertyKey, null, { registerReverse: refName });
    }
}

export function hook(name: string): any {
    return function (target: Symbol, propertyKey: string): any {
        helpers.addHook(target, propertyKey, name);
    }
}

export function route(method: string, path: string): any {
    return function (target: Symbol, propertyKey: string): any {
        helpers.addRoute(target, propertyKey, method, path);
    }
}