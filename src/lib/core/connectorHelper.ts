import { ModelFactoryBase, NonPersistentModelFactory } from '../base';
import { IModelFactory } from '../interfaces';

export class ConnectorHelper {
    public static createModelFactory(name: string, modelClass: any, options?: any): IModelFactory {
        let tempFactory = modelClass.__factory__[name];
        if (tempFactory.persistent === false) {
            return new NonPersistentModelFactory(name, modelClass);
        } else {
            //   let datasource: string = tempFactory.datasource || context().__defaultDatasource || 'mongodb';
            //   let dsId: string = datasource.indexOf(':') === -1 ? datasource : datasource.split(':')[0];
            // console.log(`Register model ${name} with datasource ${datasource}`)
            return new ModelFactoryBase(name, modelClass, options);
        }
    }


}