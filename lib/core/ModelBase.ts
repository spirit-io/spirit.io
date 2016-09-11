import mongoose = require("mongoose");
import * as read from "./interfaces/ReadController";
import * as write from "./interfaces/WriteController";
import { _ } from 'streamline-runtime';



export abstract class ModelBase {
    // fake methods overrided by decorator
    static find = (_:_, filter: any): any => {}
    static findById = (_:_, model: mongoose.Model<mongoose.Document>, id: string): any => {}
}

//Object.seal(Model);


class Helper {


    constructor(private _modulesPath: any = {}){

    }
    getClassModule(name: string) {
        let mod = this._modulesPath[name];
        if (!mod) throw new Error(`Class ${name} has noot been registered as collection.`);
        return require(this._modulesPath[name]);
    }
    addClassModule(name: string, classMod: any) {
        this._modulesPath[name] = classMod;
    }

    find = (_:_, className: string, filter: any) : any => {
        let myClass = this.getClassModule(className)[className];
        return myClass.find(_, filter);
    }
}
