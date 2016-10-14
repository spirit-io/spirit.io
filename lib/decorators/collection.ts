import { _ } from 'streamline-runtime';
import { ICollection } from '../interfaces';
import { IModelFactory } from '../interfaces';
import { ModelRegistry } from '../core/modelRegistry';
import { ConnectorHelper } from '../core/connectorHelper';
import { ModelFactoryBase } from '../base';

const helpers = require('./helpers');

export function collection(options?: ICollection): any {
    options = options || {};
    return function (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
        //if (!_.context.schemaCompiling) return target;

        // set collection name
        let modelFactory: any = helpers.initFactory(target);
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

