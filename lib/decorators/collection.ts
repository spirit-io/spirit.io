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
        // set collection name
        let modelFactory: any = helpers.initFactory(target);
        // define datasource
        if (options.datasource) modelFactory.datasource = options.datasource;

        // define persistency
        if (options.persistent != null) modelFactory.persistent = options.persistent;

        // defines principal properties
        helpers.addMetadata(target, '_id', { type: 'string', readOnly: true }, { registerIn: '$properties' });
        helpers.addMetadata(target, '_createdAt', { type: 'Date', readOnly: true }, { registerIn: '$properties' });
        helpers.addMetadata(target, '_updatedAt', { type: 'Date' }, { registerIn: '$properties' });
        //
        return target;
    };
}

