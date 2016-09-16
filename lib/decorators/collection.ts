import { Schema } from 'mongoose';
const helper = require('./helpers');

export function collection(name?: string): any {
    return function (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
        
        // defines principal properties
        helper.addMetadata(target, '_id', Schema.Types.ObjectId);
        helper.addMetadata(target, '_createdAt', Date);
        helper.addMetadata(target,'_updatedAt', Date);
        // define CRUD ORM methods
        helper.defineCRUD(target);

        return target;
    };
}