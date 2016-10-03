import { ConnectorHelper } from '../core/ConnectorHelper';

export class Contract {

    public datasources: Map<string, any>;
    constructor(private config: any) {
        for (let key in config.connectors) {
            let datasources = config.connectors[key].datasources;
            for (let ds in datasources) {
                let dsId: string = ds.indexOf(':') === -1 ? ds : ds.split(':')[0];
                ConnectorHelper.getConnector(dsId).connect(ds, datasources[ds]);
            }            
        }
    };

    static MODELS = {
        "Role": {},
        "User": {},
        "Group": {}
    };
}
Object.seal(Contract);