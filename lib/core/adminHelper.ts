import { IModelFactory, IModelHelper } from '../interfaces';
import { ModelRegistry } from './modelRegistry';
export class AdminHelper {
    public static model(target: any): IModelHelper {
        let collectionName = target.collectionName || target;
        let modelFactory: IModelFactory = ModelRegistry.getFactory(collectionName);
        if (!modelFactory) throw new Error(`Model factory not found for '${collectionName}'`);
        return modelFactory.helper;
    }
}