import { AdminHelper } from '../core';
import { IModelHelper, IParameters, ISerializeOptions } from '../interfaces';
import { insertonly } from '../decorators';
import * as diagsHelper from '../utils';

export abstract class ModelBase {
    @insertonly
    public _id: String;
    @insertonly
    public _createdAt: Date;
    public _updatedAt: Date;
    private _db: IModelHelper;

    protected constructor(item: any = {}) {
        this._db = AdminHelper.model(this.constructor);
        if (Object.keys(item).length > 0) this.updateValues(item);
    }

    /**
     * function save
     * @param data Data to save
     * @param options any Can be the following :
     * let options = {
     *      deleteMissing: true // allows to add $unset properties in order to remove values from the updated document
     * }
     * @param serializeOptions
     */
    public save(data?: any, options?: any, serializeOptions?: ISerializeOptions): any {
        return this._db.saveInstance(this, data, options, serializeOptions);
    }

    public serialize(parameters?: IParameters, options?: ISerializeOptions): any {
        return this._db.serialize(this, parameters, options);
    }

    public updateValues(item: any, options?: any): void {
        this._db.updateValues(this, item, options);
    }

    public deleteSelf() {
        this._db.deleteInstance(this);
    }

    public getMetadata(metadataName: string): any {
        return this._db.getMetadata(this, metadataName);
    }

    public isModified(property: string): boolean {
        return this._db.isModified(this, property);
    }

    public addDiagnose(severity: string, message: string, stack?: string): void {
        diagsHelper.addInstanceDiagnose(this, severity, message, stack);
    }

}
Object.seal(ModelBase);
