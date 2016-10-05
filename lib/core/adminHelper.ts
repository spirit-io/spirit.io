import { IModelFactory, IModelHelper } from '../interfaces';
import { ModelRegistry } from './modelRegistry';
export class AdminHelper {
    public static model(target: any): IModelHelper {
        let modelFactory: IModelFactory = ModelRegistry.getFactory(target);
        if (!modelFactory) throw new Error(`Model factory not found for '${target.collectionName}'`);
        return modelFactory.helper;
    }
}