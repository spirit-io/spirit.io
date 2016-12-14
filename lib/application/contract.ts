import { ConnectorHelper } from '../core/connectorHelper';
import { IModelOptions } from '../interfaces';
import { helper as objectHelper } from '../utils/object';
import { context } from 'f-promise';
import * as path from 'path';

export class Contract {

    public datasources: Map<string, any>;
    private _extendsModels: any;
    private _modelsLocation: string[] = [];

    constructor(private config: any) {
        if (this.config.defaultDatasource) {
            _.context.__defaultDatasource = this.config.defaultDatasource;
        }
    };

    public init() {
        for (let key in this.config.connectors) {
            let datasources = this.config.connectors[key].datasources;
            for (let ds in datasources) {
                let dsId: string = ds.indexOf(':') === -1 ? ds : ds.split(':')[0];
                if (!context().__defaultDatasource) context().__defaultDatasource = dsId;
                ConnectorHelper.getConnector(dsId).connect(ds, datasources[ds]);
            }
        }

        // set models locations
        if (this.config.modelsLocation) {
            this.config.modelsLocation = Array.isArray(this.config.modelsLocation) ? this.config.modelsLocation : [this.config.modelsLocation]
            this.config.modelsLocation.forEach((loc) => {
                this.registerModelsByPath(loc);
            });
        }


        // TODO: validation
        this._extendsModels = this.config.models;
    };

    public registerModelsByPath(path: string) {
        if (this._modelsLocation.indexOf(path) === -1) this._modelsLocation.push(path);
    }



    public get modelsLocations(): string[] {
        return this._modelsLocation;
    }


}
Object.seal(Contract);