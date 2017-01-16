import { AdminHelper } from '../core/adminHelper';
import { IModelHelper, IParameters, ISerializeOptions } from '../interfaces';
import { insertonly } from '../../lib/decorators';
import * as diagsHelper from '../../lib/utils';

export abstract class ModelBase {
    @insertonly
    _id: String;
    @insertonly
    _createdAt: Date;
    _updatedAt: Date;
    private _db: IModelHelper;

    constructor(item: any = {}) {
        this._db = AdminHelper.model(this.constructor);
        if (Object.keys(item).length > 0) this.updateValues(item);
    }

    /**
     * function save
     * @param options any Can be the following :
     * let options = {
     *      deleteMissing: true // allows to add $unset properties in order to remove values from the updated document
     * }
     */
    save(data?: any, options?: any, serializeOptions?: ISerializeOptions): any {
        return this._db.saveInstance(this, data, options, serializeOptions);
    }

    serialize(parameters?: IParameters, options?: ISerializeOptions): any {
        return this._db.serialize(this, parameters, options);
    }

    updateValues(item: any, options?: any): void {
        this._db.updateValues(this, item, options);
    }

    deleteSelf() {
        this._db.deleteInstance(this);
    }

    getMetadata(metadataName: string): any {
        return this._db.getMetadata(this, metadataName);
    }

    isModified(property: string): boolean {
        return this._db.isModified(this, property);
    }

    addDiagnose(severity: string, message: string, stack?: string): void {
        diagsHelper.addInstanceDiagnose(this, severity, message, stack);
    }

}
Object.seal(ModelBase);