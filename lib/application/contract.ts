import { ConnectorHelper } from '../core/ConnectorHelper';
import { IModelOptions } from '../interfaces';
import { helper as objectHelper } from '../utils/object';
import * as path from 'path';

export class Contract {

    public datasources: Map<string, any>;
    private _builtInModels: any;
    private _extendsModels: any;
    private _modelsLocation: string[] = [];

    constructor(private config: any) {
        this.initConnectors();
        this.initBuiltInModels();
        this.initExtendsModels();
    };

    private initConnectors = () => {
        for (let key in this.config.connectors) {
            let datasources = this.config.connectors[key].datasources;
            for (let ds in datasources) {
                let dsId: string = ds.indexOf(':') === -1 ? ds : ds.split(':')[0];
                ConnectorHelper.getConnector(dsId).connect(ds, datasources[ds]);
            }            
        }
    }

    private initBuiltInModels = () => {
        this._builtInModels = {
            "Role": {},
            "User": {},
            "Group": {}
        }
        this._modelsLocation.push(path.resolve(path.join(__dirname, '../models')));
    };

    private initExtendsModels = () => {
        if (!this.config.models) return;
        
        // set models locations
        if (!this.config.modelsLocation) throw new Error(`'modelsLocation' configuration property must be set to register extends models`);
        this.config.modelsLocation = Array.isArray(this.config.modelsLocation) ? this.config.modelsLocation : [this.config.modelsLocation]
        this.config.modelsLocation.forEach((loc) => {
            this._modelsLocation.push(loc);
        });
        
        
        // TODO: validation
        this._extendsModels = this.config.models;
    };

    public get builtInModels(): any {
        return this._builtInModels;
    }

    public get extendsModels(): any {
        return this._extendsModels;
    }

    public get modelsLocations(): string[] {
        return this._modelsLocation;
    }

    public get models(): Map<string, IModelOptions> {
        let merged: any = objectHelper.clone(this.builtInModels, true);
        objectHelper.merge(this.extendsModels, merged);
        let _models = new Map();
        Object.keys(merged).forEach(function(key: string) {
            _models.set(key, merged[key]);
        }, []);
        return _models;
    }


}
Object.seal(Contract);