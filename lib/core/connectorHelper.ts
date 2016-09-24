import { _ } from 'streamline-runtime';
import { IModelFactory, IConnector } from '../interfaces';
import { synchronize } from '../utils';


_.context.connectors = new Map<string, IConnector>();

export class ConnectorHelper {

    @synchronize()
    public static getConnector(ds: string): IConnector {
        let c = _.context.connectors.get(ds);
        if (!c) {
            let type = ds.indexOf(':') !== -1 ? ds.split(':')[0] : ds;
            switch (type) {
                case 'redis':
                    try {
                        let RedisConnector = require('spirit.io-redis-connector');
                        c = new RedisConnector();
                    } catch (e) {
                        throw new Error("spirit.io-redis-connector is not available.\nPlease use 'npm install spirit.io-redis-connector'.");
                    }
                    break;
                case 'mongodb':
                default:
                    try {
                        let MongodbConnector = require('spirit.io-mongodb-connector');
                        c = new MongodbConnector();
                    } catch (e) {
                        throw new Error("spirit.io-mongodb-connector is not available.\nPlease use 'npm install spirit.io-mongodb-connector'.");
                    }
                    break;
            }
            _.context.connectors.set(type, c);
        }
        return c;
    }

    static createModelFactory(modelClass: any): IModelFactory {
        let datasource: string = modelClass._datasource || 'mongodb';
        return ConnectorHelper.getConnector(datasource).createModelFactory(modelClass);
    }
}