import * as helpers from './helpers';
import { RequiredValidator, InsertOnlyValidator } from '../validators';
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
    helpers.addValidator(target.constructor, new RequiredValidator());

}

export function embedded(target: any, propertyKey: string) {
    helpers.addMetadata(target.constructor, propertyKey, { embedded: true });
}

export function insertonly(target: any, propertyKey: string) {
    helpers.addMetadata(target.constructor, propertyKey, { insertOnly: true });
    helpers.addValidator(target.constructor, new InsertOnlyValidator());
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