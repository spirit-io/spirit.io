import * as helpers from './helpers';
import { Registry } from '../core';
import { RequiredValidator } from '../validators';
// !!!!!!!!!!!!!!!
// properties metadata have to be stored on class constructor
// !!!!!!!!!!!!!!!

/**
 * Property decorator that allows to set `required` metadata on factory's prototype property.
 * This would add the capability on the property to be required using standard mongoose `required` validator.
 * See http://mongoosejs.com/docs/api.html#schematype_SchemaType-required for details.
 */
export function required(target: any, propertyKey: string) {
    helpers.addMetadata(target.constructor, propertyKey, { required: true });
    Registry.registerValidator(new RequiredValidator());
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