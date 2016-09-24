import { ConnectorHelper } from '../core/ConnectorHelper';

export class Contract {

    public datasources: Map<string, any>;
    constructor(private config: any = {
        datasources: {
            "mongodb:default": {uri: "mongodb://localhost/spirit", options: {}}
        }
    }) {
        for (let key in config.datasources) {
            if (key.indexOf(':') === -1) console.error(`Invalid datasource '${key}: ${JSON.stringify(config.datasources[key],null,2)}. The key must contain ':' to separate type and name (eg: 'mongodb:myDatasource').`);
            ConnectorHelper.getConnector(key.split(':')[0]).connect(key, config.datasources[key]);
        }
    };

    static MODELS = {
        "Role": {},
        "User": {}
    };
}
Object.seal(Contract);