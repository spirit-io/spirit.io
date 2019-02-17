import { IModelFactory, IModelHelper } from '../interfaces';
import { Registry } from './registry';

export class AdminHelper {
    public static model(target: any): IModelHelper {
        const collectionName = target.collectionName || target;
        const modelFactory = Registry.getFactory(collectionName);
        return modelFactory && modelFactory.helper;
    }

    public static enum(name: string): Object {
        const myEnum: Object = Registry.getEnum(name);
        if (!myEnum) throw new Error(`Enum not found for '${name}'`);
        return myEnum;
    }
}
