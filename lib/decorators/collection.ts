import { ICollection } from '../interfaces';
import { IModelFactory } from '../interfaces';
import { ModelRegistry } from '../core/modelRegistry'
const helpers = require('./helpers');

export function collection(options?: ICollection): any {
    options = options || {};
    return function (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
        // set collection name
        let modelFactory: IModelFactory = ModelRegistry.getbuildingFactory(target);
        // define datasource
        if (options.datasource) modelFactory.datasource = options.datasource;

        // defines principal properties
        helpers.addMetadata(target, '_id', String, {registerIn: '$properties'});
        helpers.addMetadata(target, '_createdAt', Date, {registerIn: '$properties'});
        helpers.addMetadata(target, '_updatedAt', Date, {registerIn: '$properties'});
        //
        return target;
    };
}

