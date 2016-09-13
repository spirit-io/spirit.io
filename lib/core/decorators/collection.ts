import { _ } from 'streamline-runtime';
const mongoose = require('mongoose');

export function collection(name?: string): any {
    return function (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {

        function ensureId(item: any) {
            if (item._id && typeof item._id === "string") {
                console.log("Convert to object ID");
                item._id = mongoose.Types.ObjectId(item._id)
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
            return target._model.create(item, _);
        }

        target.update = (_: _, _id: any, item: any) => {
            item._updatedAt = Date.now();
            return target._model.update({ _id: _id }, item, _);
        }

        target.createOrUpdate = function (_: _, _id: any, item: any) {
            let doc = target.findById(_, _id);
            if (doc) {
                item._updatedAt = Date.now();
                return target._model.update({ _id: _id }, item, _);
            } else {
                ensureId(item);
                item._createdAt = Date.now();
                item._updatedAt = Date.now();
                return target._model.create(item, _);
            }
        };

        target.remove = (_: _, _id: any) => {
            return target._model.remove({ _id: _id }, _);
        }

        target.fetchInstance = (_:_, _id: any) => {
            return new target.prototype.constructor(target.findById(_, _id).toObject());
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