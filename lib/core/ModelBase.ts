import mongoose = require("mongoose");
import * as read from "./interfaces/ReadController";
import * as write from "./interfaces/WriteController";
import { _ } from 'streamline-runtime';



export abstract class ModelBase {
    // fake methods overrided by decorator
    static find = (_:_, filter: any): any => {}
    static findById = (_:_, _id: string): any => {}
    static create = (_:_, item: any): any => {}
    static update = (_:_, _id: string, item: any): any => {}
}
Object.seal(ModelBase);