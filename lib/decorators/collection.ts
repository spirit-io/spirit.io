import { Schema } from 'mongoose';
import { ICollection } from './interfaces';
const helpers = require('./helpers');

export function collection(options?: ICollection): any {
    options = options || {};
    return function (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
        // set collection name
        target._collectionName = options.name || getClassName(target);
        // defines principal properties
        helpers.addMetadata(target, '_id', Schema.Types.ObjectId);
        helpers.addMetadata(target, '_createdAt', Date);
        helpers.addMetadata(target,'_updatedAt', Date);
        // define CRUD ORM methods
        helpers.defineMethods(target);
        //
        return target;
    };
}

function getClassName(target: any) {
    let regex = /^function ([^ (){]{1,})/;
    let res = (regex).exec(target.toString());
    return (res && res.length > 1) ? res[1] : null;
}