import { IModelFactory } from '../interfaces';
import { ConnectorHelper } from './connectorHelper';
export class ModelRegistry {
    static factories: Map<string, IModelFactory> = new Map();

    private static register(modelFactory: IModelFactory): void {
        this.factories.set(modelFactory.collectionName, modelFactory);
    }

    public static getByName(collectionName: any): IModelFactory {
        return this.factories.get(collectionName);
    }
    
    public static get(target: any): IModelFactory {
        let collectionName = target._collectionName;
        let f = this.factories.get(collectionName);
        if (!f) {
            f = ConnectorHelper.createModelFactory(target);
            this.factories.set(collectionName, f);
        }
        return f;
    }
}