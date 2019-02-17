import { context } from 'f-promise';
import { NonPersistentModelFactory } from '../base';
import { IModelFactory, IConnector } from '../interfaces';
import { synchronize } from '../utils';

export class ConnectorHelper {

    @synchronize()
    public static getConnector(ds: string): IConnector {
        context().connectors = context().connectors || new Map<string, IConnector>();
        const c = context().connectors.get(ds);
        if (!c) {
            throw new Error(`No connector registered for datasource ${ds}`);
        }
        return c;
    }

    @synchronize()
    public static setConnector(connector: IConnector): void {
        const ds = connector.datasource;
        context().connectors = context().connectors || new Map<string, IConnector>();
        context().connectors.set(ds, connector);
    }

    public static createModelFactory(name: string, modelClass: any, options?: any): IModelFactory {
        const tempFactory = modelClass.__factory__[name];
        if (tempFactory.persistent === false) {
            return new NonPersistentModelFactory(name, modelClass);
        }  {
            const datasource: string = tempFactory.datasource || context().__defaultDatasource || 'mongodb';
            const dsId: string = datasource.indexOf(':') === -1 ? datasource : datasource.split(':')[0];
            // console.log(`Register model ${name} with datasource ${datasource}`)
            const c = ConnectorHelper.getConnector(dsId);
            return c.createModelFactory(name, modelClass, options);
        }
    }
}
