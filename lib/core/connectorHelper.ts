import { _ } from 'streamline-runtime';
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
    public static setConnector(ds: string, connector: IConnector): void {
        _.context['connectors'] = _.context['connectors'] || new Map<string, IConnector>();
        _.context['connectors'].set(ds, connector);
    }

    public static createModelFactory(name: string, modelClass: any): IModelFactory {
        let datasource: string = modelClass._datasource || _.context.__defaultDatasource || 'mongodb';
        return ConnectorHelper.getConnector(datasource).createModelFactory(name, modelClass);
    }
}