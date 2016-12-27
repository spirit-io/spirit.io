import { ConnectorHelper } from '../core/connectorHelper';
import { Compiler } from "../core";
import { context } from 'f-promise';

/**
 * The spirit.io application contract is responsible for managing datasources and their connection.
 * It allows also to manage classes models locations that would be used by the typescript compiler.
 */
export class Contract {

    /** Datasources Map identified by a string that could contains a colon `:` separator. */
    public datasources: Map<string, any>;
    /** A string array that contains all the models paths registered. */
    private _modelsLocation: string[] = [];

    /**
     * A config object must be passed in the constructor.
     * See config file documentation.
     * @param any The config object.
     */
    constructor(private config: any) {
        if (this.config.defaultDatasource) {
            context().__defaultDatasource = this.config.defaultDatasource;
        }
    };

    /**
     * Initialize connections for all datasources defined in config `connectors` section.
     * And register models location defined by config `modelsLocation` section.
     * See configuration file documentation for mode details.
     */
    public init() {
        for (let key in this.config.connectors) {
            let datasources = this.config.connectors[key].datasources;
            for (let ds in datasources) {
                let dsId: string = ds.indexOf(':') === -1 ? ds : ds.split(':')[0];
                if (!context().__defaultDatasource) context().__defaultDatasource = dsId;
                if (datasources[ds].autoConnect) ConnectorHelper.getConnector(dsId).connect(ds);
            }
        }

        // set models locations
        if (this.config.modelsLocation) {
            this.config.modelsLocation = Array.isArray(this.config.modelsLocation) ? this.config.modelsLocation : [this.config.modelsLocation]
            this.config.modelsLocation.forEach((loc) => {
                this.registerModelsByPath(loc);
            });
        }


        Compiler.registerModels(this.modelsLocations);
    };

    /**
     * Allows to register new models location specifying its path.
     * @param string An absolute path
     */
    public registerModelsByPath(path: string) {
        if (this._modelsLocation.indexOf(path) === -1) this._modelsLocation.push(path);
    }


    /**
     * Allows to get all registered models paths.
     */
    public get modelsLocations(): string[] {
        return this._modelsLocation;
    }


}
Object.seal(Contract);