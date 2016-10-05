import { IModelFactory } from '../interfaces';
import { ConnectorHelper } from './connectorHelper';
export class ModelRegistry {
    static factories: Map<string, IModelFactory> = new Map();
    static buildingFactory: IModelFactory;

    private static register(modelFactory: IModelFactory): void {
        this.factories.set(modelFactory.collectionName, modelFactory);
    }

    public static getFactoryByName(collectionName: string): IModelFactory {
        return this.factories.get(collectionName.toLowerCase());
    }
    
    public static getFactory(target: any): IModelFactory {
        if (typeof target === 'string') {
            return this.factories.get(target);
        }
        let collectionName = target._collectionName;
        return this.factories.get(collectionName);
    }

    public static getbuildingFactory(target: any): IModelFactory {
        if (!this.buildingFactory) this.buildingFactory = ConnectorHelper.createModelFactory(target);
        return this.buildingFactory;
    }

    public static releaseBuildingFactory(collectionName: string): IModelFactory {
        if (!this.buildingFactory) throw new Error('No currently building factory found');
        let f = this.buildingFactory;
        f.collectionName = collectionName;
        this.factories.set(collectionName, f);
        this.buildingFactory = null;
        return f;
    }
}