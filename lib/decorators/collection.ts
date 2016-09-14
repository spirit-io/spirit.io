import { _ } from 'streamline-runtime';
const mongoose = require('mongoose');

export function collection(name?: string): any {
    return function (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {

        function ensureId(item: any) {
            if (item._id && typeof item._id === "string") {
                item._id = mongoose.Types.ObjectId(item._id);
            } else {
                item._id = item._id || mongoose.Types.ObjectId();
            }
        }

        // _model is computed by SchemaCompiler
        target.find = (_: _, filter: any = {}) => {
            return target._model.find(filter, target._properties.join(' '), _);
        }

        target.findById = (_: _, id: any) => {
            return target._model.findById(id, _);
        }

        target.create = (_: _, item: any) => {
            ensureId(item);
            item._createdAt = Date.now();
            item._updatedAt = Date.now();
            let doc = target._model.create(item, _);
            return doc && doc.toObject();
        }

        target.update = (_: _, _id: any, item: any, options?: any) => {
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
            let doc = target._model.findOneAndUpdate(_id, data, {runValidators: true, new: true, context: 'query'}, _);
            return doc && doc.toObject();
        }

        target.createOrUpdate = function (_: _, _id: any, item: any, options?: any) {
            let doc = target.findById(_, _id);
            if (doc) {
                return target.update(_, _id , item, options);
            } else {
                return target.create(_, item);
            }
        };

        target.remove = (_: _, _id: any) => {
            return target._model.remove({ _id: _id }, _);
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

        return target;
    };
}