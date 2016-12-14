import { context } from 'f-promise';
import { Router } from 'express';
import { NonPersistentModelFactory } from '../base';
import { IModelFactory, IConnector } from '../interfaces';
import { synchronize } from '../utils';


export class ConnectorHelper {

    @synchronize()
    public static getConnector(ds: string): IConnector {
        _.context['connectors'] = _.context['connectors'] || new Map<string, IConnector>();
        let c = _.context['connectors'].get(ds);
        if (!c) {
            throw new Error(`No connector registered for datasource ${ds}`);
        }
        return c;
    }

    @synchronize()
    public static setConnector(connector: IConnector): void {
        let ds = connector.datasource;
        context()['connectors'] = context()['connectors'] || new Map<string, IConnector>();
        context()['connectors'].set(ds, connector);
    }

    public static createModelFactory(name: string, modelClass: any): IModelFactory {
        let tempFactory = modelClass.__factory__[name];
        if (tempFactory.persistent === false) {
            return new NonPersistentModelFactory(name, modelClass);
        } else {
            let datasource: string = tempFactory.datasource || context().__defaultDatasource || 'mongodb';
            let dsId: string = datasource.indexOf(':') === -1 ? datasource : datasource.split(':')[0];
            // console.log(`Register model ${name} with datasource ${datasource}`)
            return ConnectorHelper.getConnector(dsId).createModelFactory(name, modelClass);
        }
    }
}