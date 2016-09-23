import { _ } from 'streamline-runtime';
import { Schema } from 'mongoose';
import { AdminHelper } from '../core/adminHelper';
import { IModelHelper } from '../interfaces';

export abstract class ModelBase {
    protected _id: Schema.Types.ObjectId;
    protected _createdAt: Date;
    protected _updatedAt: Date;
    private _db: IModelHelper;
    
    constructor(item: any = {}) {
        this._db = AdminHelper.model(this.constructor);
        this.updateValues(item);
    }

    get id(): Schema.Types.ObjectId {
        return this._id;
    }
    get createdAt(): Date {
        return this._createdAt;
    }
    get updatedAt(): Date {
        return this._updatedAt;
    }

    /**
     * function save
     * @param _ _ streamline callback
     * @param options any Can be the following :
     * let options = {
     *      deleteMissing: true // allows to add $unset properties in order to remove values from the updated document
     * }
     */
    save = (_: _, options?: any): any => {
        return this._db.saveInstance(_, this, options);
    }

    serialize = (): any => {
        return this._db.serialize(this);
    }

    updateValues = (item: any, options?: any): void => {
        this._db.updateValues(this, item, options);
    }

}
Object.seal(ModelBase);