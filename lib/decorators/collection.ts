import { Schema } from 'mongoose';
import { ICollection } from '../interfaces';
const helpers = require('./helpers');

export function collection(options?: ICollection): any {
    options = options || {};
    return function (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
        // set collection name
        target._collectionName = options.name || target._collectionName || helpers.getClassName(target);
        // defines principal properties
        helpers.addMetadata(target, '_id', Schema.Types.ObjectId);
        helpers.addMetadata(target, '_createdAt', Date);
        helpers.addMetadata(target, '_updatedAt', Date);
        //
        return target;
    };
}

