import * as read from "./interfaces/ReadController";
import * as write from "./interfaces/WriteController";
import { _ } from 'streamline-runtime';

const mongoose = require('mongoose');


export abstract class ModelBase {
    protected _id: string;

    constructor(item: any = {}) {
        //console.log("Constructor base called: ",item);
        for (let key of Object.keys(item)) {
            if (this.constructor['_properties'].indexOf(key) !== -1) this[key] = item[key];
        }
    }

    // fake methods overrided by decorator
    static find = (_:_, filter?: any): any => {}
    static findById = (_:_, _id: string): any => {}
    static create = (_:_, item: any): any => {}
    static update = (_:_, _id: string, item: any): any => {}
    static createOrUpdate = (_: _, _id: any, item: any) => {}
    static remove = (_: _, _id: any) => {}
    static fetchInstance = (_, _id: string): ModelBase => {return;}
    static fetchInstances = (_, filter?: any): ModelBase[] => {return;}
    // real orm methods
    save = (_: _) => {
        return this.constructor['createOrUpdate'](_, this._id, this.toObject());
    }

    private toObject = () => {
        let obj: any = {};
        for (let key of this.constructor['_properties']) {
            if (this[key]) obj[key] = this[key];
        }
        return obj;
    }
    
}
Object.seal(ModelBase);