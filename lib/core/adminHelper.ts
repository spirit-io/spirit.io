import { IModelFactory, IModelHelper } from '../interfaces';
import { ModelRegistry } from './modelRegistry';
export class AdminHelper {
    public static model(target: any): IModelHelper {
        let modelFactory: IModelFactory = ModelRegistry.get(target);
        return modelFactory.helper;
    }
}