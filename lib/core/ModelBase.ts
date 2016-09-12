import * as read from "./interfaces/ReadController";
import * as write from "./interfaces/WriteController";
import { _ } from 'streamline-runtime';

const mongoose = require('mongoose');


export abstract class ModelBase {
    protected _id: string;

    constructor(item: any = {}) {
        console.log("Constructor base called: ",item);
        this._id = item.id || mongoose.Types.ObjectId();
        for (let key of Object.keys(item)) {
            this[key] = item[key];
        }
    }

    // fake methods overrided by decorator
    static find = (_:_, filter: any): any => {}
    static findById = (_:_, _id: string): any => {}
    static create = (_:_, item: any): any => {}
    static update = (_:_, _id: string, item: any): any => {}
    static createOrUpdate = (_: _, _id: any, item: any) => {}
    static remove = (_: _, _id: any) => {}
    // real orm methods
    save = (_) => {
        return this.constructor.createOrUpdate(_, this._id, JSON.parse(JSON.stringify(this)));
    }
}
Object.seal(ModelBase);