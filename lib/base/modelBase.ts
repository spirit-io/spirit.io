import { _ } from 'streamline-runtime';
import { AdminHelper } from '../core/adminHelper';
import { IModelHelper } from '../interfaces';
import { readonly } from '../../lib/decorators';

export abstract class ModelBase {
    @readonly
    protected _id: string;
    @readonly
    protected _createdAt: Date;
    protected _updatedAt: Date;
    private _db: IModelHelper;

    constructor(item: any = {}) {
        this._db = AdminHelper.model(this.constructor);
        if (Object.keys(item).length > 0) this.updateValues(item);
    }

    get id(): String {
        return this._db.getMetadata(this, '_id');
    }
    get createdAt(): Date {
        return this._db.getMetadata(this, '_createdAt');
    }
    get updatedAt(): Date {
        return this._db.getMetadata(this, '_updatedAt');
    }

    /**
     * function save
     * @param _ _ streamline callback
     * @param options any Can be the following :
     * let options = {
     *      deleteMissing: true // allows to add $unset properties in order to remove values from the updated document
     * }
     */
    save(_: _, data?: any, options?: any): any {
        return this._db.saveInstance(_, this, data, options);
    }

    serialize(_: _): any {
        return this._db.serialize(_, this);
    }

    updateValues(item: any, options?: any): void {
        this._db.updateValues(this, item, options);
    }

    getMetadata(metadataName: string): any {
        return this._db.getMetadata(this, metadataName);
    }

    isModified(property: string): boolean {
        return this._db.isModified(this, property);
    }

}
Object.seal(ModelBase);