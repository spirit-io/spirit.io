import { _ } from 'streamline-runtime';
import { Schema } from 'mongoose';

export abstract class ModelBase {
    protected _id: Schema.Types.ObjectId;
    protected _createdAt: Date;
    protected _updatedAt: Date;

    constructor(item: any = {}) {
        //console.log("Constructor base called: ",item);
        this.populate(item);
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

    // fake methods overrided by decorator
    static find = (_: _, filter?: any): any => { }
    static findById = (_: _, _id: string): any => { }
    static create = (_: _, item: any): any => { }
    static update = (_: _, _id: string, item: any): any => { }
    static createOrUpdate = (_: _, _id: any, item: any): any => { }
    static remove = (_: _, _id: any): any => { }
    static fetchInstance = (_, _id: string): ModelBase => { return; }
    static fetchInstances = (_, filter?: any): ModelBase[] => { return; }
    // real orm methods
    /**
     * function save
     * @param _ _ streamline callback
     * @param options any Can be the following :
     * let options = {
     *      deleteMissing: true // allows to add $unset properties in order to remove values from the updated document
     * }
     */
    save = (_: _, options?: any) => {
        let item = this.constructor['createOrUpdate'](_, this._id, this.toObject(), options);
        this.populate(item, {deleteMissing: true});
        return this.toObject();
    }

    private toObject = () => {
        let obj: any = {};
        for (let key of this.constructor['_properties']) {
            if (this[key]) obj[key] = this[key];
        }
        return obj;
    }

    private populate = (item: any, options?: any) => {
        // update new values
        for (let key of Object.keys(item)) {
            if (this.constructor['_properties'].indexOf(key) !== -1) this[key] = item[key];
        }

        if (options && options.deleteMissing) {
            // reinitialize deleted values
            for (let key of this.constructor['_properties']) {
                if (!item.hasOwnProperty(key)) {
                    this[key] = undefined;
                }
            }
        }
    }

}
Object.seal(ModelBase);