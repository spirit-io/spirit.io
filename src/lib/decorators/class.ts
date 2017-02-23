import * as helpers from './helpers';

/**
 * These are the options that allows to define special cases for your models.
 * @param datasource Allows to assign different datasource that is defined as default for this model.
 * @param persistent Allows to set your model as non persistent. 
 * It could be useful in some cases where you don't need to store data, but you need services.
 */
export interface IModel {
    datasource?: string;
    persistent?: boolean;
    useFactory?: string;
}
/**
 * The class decorator necessary to register your model.
 * @param IModel Some specific model's options. See IModel interface.
 */
export function model(options?: IModel): any {
    options = options || {};
    return function (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
        // set collection name
        let modelFactory: any = helpers.initFactory(target, options.useFactory);
        // define datasource
        if (options.datasource) modelFactory.datasource = options.datasource;

        // define persistency
        if (options.persistent != null) modelFactory.persistent = options.persistent;

        // defines principal properties
        helpers.addMetadata(target, 'id', { type: 'String', insertOnly: true }, { registerIn: '$properties' });
        helpers.addMetadata(target, '_createdAt', { type: 'Date', insertOnly: true }, { registerIn: '$properties' });
        helpers.addMetadata(target, '_updatedAt', { type: 'Date' }, { registerIn: '$properties' });
        //
        return target;
    };
}

