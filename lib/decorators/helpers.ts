import { _ } from 'streamline-runtime';
import { helper as objectHelper } from '../utils/object';
import { Query } from 'mongoose';
import { IPopulate } from './interfaces';
const mongoose = require('mongoose');

export function getFieldDecorator (options: any): any {
    function fieldDecorator(target: Symbol, propertyKey: string): any {
        addMetadata(target.constructor, propertyKey, options);
    }
    return fieldDecorator;
}

export function addMetadata(target: any, key: string, meta: any, force?: boolean) {
    target._schemaDef = target._schemaDef || {};
    if (target._schemaDef[key]) {
        objectHelper.merge(meta, target._schemaDef[key]);
    } else {
        target._schemaDef[key] = meta;
    }
}

export function defineMethods(target: any) {
    function ensureId(item: any) {
        if (item._id && typeof item._id === "string") {
            item._id = mongoose.Types.ObjectId(item._id);
        } else {
            item._id = item._id || mongoose.Types.ObjectId();
        }
    }

    function populateQuery(query: Query<any>, includes: string) {
        try {
            includes = JSON.parse(includes);
        } catch(err) {}
        if (typeof includes === "string" || (typeof includes === "object" && !Array.isArray(includes))) {
            query = query.populate(includes);
        } else {
            for (let include of includes) {
                query = query.populate(include);
            }
        }
    }
    // _model is computed by SchemaCompiler
    target.find = (_: _, filter: Object = {}, options?: any) => {
        options = options || {};
        let query: Query<any> = target._model.find(filter, target._properties.join(' '));
        if (options.includes) populateQuery(query, options.includes);
        return (<any>query).exec(_);
    }

    target.findById = (_: _, id: any, options?: any) => {
        options = options || {};
        let query: Query<any> = target._model.findById(id);
        if (options.includes) populateQuery(query, options.includes);
        return (<any>query).exec(_);
    }

    target.create = (_: _, item: any) => {
        ensureId(item);
        item._createdAt = Date.now();
        item._updatedAt = Date.now();
        //console.log("Create Item: ",item);
        let doc = target._model.create(item, _);
        return doc && doc.toObject();
    }

    target.update = (_: _, _id: any, item: any, options?: any) => {
        if (item._id) delete item._id;
        item._updatedAt = Date.now();
        let data: any = {$set: item};
        if (options && options.deleteMissing) {
            for (let key of target._properties) {
                if (!item.hasOwnProperty(key)) {
                    data.$unset = data.$unset || {};
                    data.$unset[key] = 1;
                }
            }
        }
        //console.log("Update Item: ",item);
        let doc = target._model.findOneAndUpdate({_id: _id}, data, {runValidators: true, new: true, context: 'query'}, _);
        return doc && doc.toObject();
    }

    target.createOrUpdate = function (_: _, _id: any, item: any, options?: any) {
        
        let doc = target.findById(_, _id);
        if (doc) {
            //console.log(`update ${_id}`);
            return target.update(_, _id , item, options);
        } else {
            //console.log(`create ${_id}`);
            return target.create(_, item);
        }
    };

    target.remove = (_: _, _id: any) => {
        return target._model.remove({ _id: _id }, _);
    }

    target.populate = (_: _, docs: any, options: IPopulate) => {
        return target._model.populate(docs, options, _);
    }

    target.fetchInstance = (_:_, _id: any) => {
        let doc = target.findById(_, _id);
        if (!doc) return;
        return new target.prototype.constructor(doc.toObject());
    }

    target.fetchInstances = (_, filter?: any) => {
        let instances: any = [];
        let docs = target.find(_, filter);
        for (var doc of docs) {
            instances.push(new target.prototype.constructor(doc.toObject()));
        }
        return instances;
    }
}