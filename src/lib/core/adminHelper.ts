import { IModelFactory, IModelHelper } from '../interfaces';
import { Registry } from './registry';
export class AdminHelper {
    public static model(target: any): IModelHelper {
        let collectionName = target.collectionName || target;
        let modelFactory: IModelFactory = Registry.getFactory(collectionName);
        if (!modelFactory) throw new Error(`Model factory not found for '${collectionName}'`);
        return modelFactory.helper;
    }

    public static enum(name: string): Object {
        let myEnum: Object = Registry.getEnum(name);
        if (!myEnum) throw new Error(`Enum not found for '${name}'`);
        return myEnum;
    }
}