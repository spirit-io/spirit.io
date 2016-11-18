import { _ } from 'streamline-runtime';
import {
    IModelFactory,
    IModelHelper,
    IModelActions,
    IQueryParameters,
    IFetchParameters,
    ISaveParameters,
    ISerializeOptions
} from '../interfaces';
import { ModelRegistry, AdminHelper } from '../core';
import { helper as objectHelper } from '../utils';

export abstract class ModelHelperBase implements IModelHelper {

    public modelFactory: IModelFactory;
    constructor(modelFactory: IModelFactory) {
        this.modelFactory = modelFactory;
    }

    private _patchParameters(parameters?: IQueryParameters | IFetchParameters, serializeOptions?: ISerializeOptions) {
        parameters = parameters || {};
        serializeOptions = serializeOptions || {};

        // force to include all references when ignoreRef is not declared
        if (!serializeOptions || !parameters || (!serializeOptions.serializeRef && !parameters.includes)) {
            let includes = [];
            Object.keys(this.modelFactory.$references).forEach((ref) => {
                includes.push(ref);
            });
            parameters.includes = includes.join(',');
        }

        // transform includes to array of objects
        parameters.includes = this._parseIncludes(parameters.includes);

        return parameters;
    }

    private _parseIncludes(includes: any): any[] {
        function parseIncludesStr(_includes) {
            function parseIncludeStr(_include) {
                let opt: any = {};
                if (_include.indexOf('.') !== -1) {
                    let parts = _include.split('.');
                    opt.path = parts[0];
                    opt.select = parts[1];
                } else {
                    opt.path = _include;
                }
                transformed.push(opt);
            }
            let transformed = [];

            if (_includes.indexOf(',') !== -1) {
                _includes.split(',').forEach(i => {
                    parseIncludeStr(i);
                });
            } else {
                parseIncludeStr(_includes);
            }
            return transformed;
        }

        if (includes == null) return [];

        if (typeof includes !== 'object' && (includes.charAt(0) === '{' || includes.charAt(0) === '[')) {
            try {
                includes = JSON.parse(includes);
            } catch (err) {
                throw new Error('JSON includes filter is not valid');
            }
        }

        // transform parameter to array of objects
        if (typeof includes === "string") {
            includes = parseIncludesStr(includes);
        }
        if (!Array.isArray(includes)) {
            includes = [includes];
        }
        return includes;
    }

    fetchInstances(_: _, filter?: any, parameters?: IQueryParameters, serializeOptions?: ISerializeOptions) {
        parameters = this._patchParameters(parameters, serializeOptions);
        let instances: any = [];
        let docs = this.modelFactory.actions.query(_, filter, parameters);
        for (var doc of docs) {
            let inst = new this.modelFactory.targetClass.prototype.constructor();
            this.updateValues(inst, doc);
            instances.push(serializeOptions ? this.serialize(inst, parameters, serializeOptions) : inst);
        }
        return instances;
    }

    fetchInstance(_: _, _id: string, parameters?: IFetchParameters, serializeOptions?: ISerializeOptions) {
        parameters = this._patchParameters(parameters, serializeOptions);
        let doc = this.modelFactory.actions.read(_, _id, parameters);
        if (!doc) return null;
        let inst;
        if (parameters && parameters.ref) {
            let refFactory = this.modelFactory.getModelFactoryByPath(parameters.ref);
            inst = new refFactory.targetClass.prototype.constructor();
            this.updateValues(inst, doc, { modelFactory: refFactory });
            if (serializeOptions) serializeOptions.modelFactory = refFactory;
        } else {
            inst = new this.modelFactory.targetClass.prototype.constructor();
            this.updateValues(inst, doc);
        }
        return serializeOptions ? this.serialize(inst, parameters, serializeOptions) : inst;
    }

    saveInstance(_: _, instance: any, data?: any, options?: ISaveParameters, serializeOptions?: ISerializeOptions) {
        options = this._patchParameters(options, serializeOptions);
        if (data) this.updateValues(instance, data, { deleteMissing: options.deleteMissing || false });
        let serialized = this.serialize(instance, null, serializeOptions);
        let item = this.modelFactory.actions.createOrUpdate(_, instance._id, serialized, options);
        this.updateValues(instance, item, { deleteMissing: true });
        if (!serializeOptions) return instance;
        return this.serialize(instance, null, serializeOptions);
    }

    deleteInstance(_: _, instance: any): any {
        return this.modelFactory.actions.delete(_, instance._id);
    }

    serialize(instance: any, parameters?: IQueryParameters | IFetchParameters, options?: ISerializeOptions): any {
        options = options || {};
        parameters = parameters || {};
        // consider correct modelFactory (for relation potentially)
        let mf = options.modelFactory || this.modelFactory;
        let item: any = {};

        let includes = parameters.includes ? parameters.includes.map((i) => { return typeof i === 'object' ? i.path : i }) : [];
        let sTrace;// = console.log;
        for (let key of mf.$fields) {
            sTrace && sTrace("====== Field ", key);
            if (instance[key] !== undefined) {
                if (mf.$references.hasOwnProperty(key) && typeof instance[key] === 'object') {
                    if (mf.$plurals.indexOf(key) !== -1) {
                        sTrace && sTrace("Plural ref ", key);
                        instance[key] = Array.isArray(instance[key]) ? instance[key] : [instance[key]];
                        let notInclude = options.serializeRef && includes.indexOf(key) === -1;
                        item[key] = instance[key].map((inst) => {
                            // only ids if reference serialization is not expected
                            if (notInclude && typeof inst === 'object' && inst._id) {
                                sTrace && sTrace("Not include ref ", key);
                                return inst._id;
                            }
                            // serialize reference
                            else {
                                sTrace && sTrace("Include ref ", key);
                                let _db = AdminHelper.model(inst.constructor);
                                let sRef = _db.serialize(inst, null, options);
                                if (sRef && sRef._id) return sRef;
                            }
                        }).filter((inst) => { return inst != null });
                    } else {
                        sTrace && sTrace("Singular ", key);
                        // only ids if reference serialization is not expected
                        if (options.serializeRef && includes.indexOf(key) === -1 && typeof instance[key] === 'object' && instance[key]._id) {
                            sTrace && sTrace("Not include ref ", key);
                            item[key] = instance[key]._id;
                        }
                        // serialize reference
                        else {
                            sTrace && sTrace("Include ref ", key);
                            let _db = AdminHelper.model(instance[key].constructor);
                            let sRef = _db.serialize(instance[key], null, options);
                            if (sRef && sRef._id) item[key] = sRef
                        }
                    }
                }
                // serialize as it is
                else {
                    sTrace && sTrace("Simple prop ", key);
                    item[key] = instance[key];
                }

            } else if (!options.ignoreNull) {
                sTrace && sTrace("Set to undefined ", key);
                item[key] = undefined;
            }
            else {
                sTrace && sTrace("IGNORE Field ", key);
            }
        }
        sTrace && sTrace("Serialize:", item);
        return item;
    }

    updateValues(instance: any, item: any, options?: any): void {
        if (!instance || !item) return null;
        options = options || {};
        // consider correct modelFactory (for relation potentially)
        let mf = options.modelFactory || this.modelFactory;
        // update new values
        for (let key of Object.keys(item)) {
            if (mf.$fields.indexOf(key) !== -1) {
                //console.log(`Update key ${key} with value: ${item[key]}`)

                // instanciate references
                if (this.modelFactory.$references[key]) {
                    let type = this.modelFactory.getReferenceType(key);
                    let refValue;
                    if (Array.isArray(item[key]) && item[key].length) {
                        refValue = [];
                        item[key].forEach((it) => {
                            if (it) refValue.push(this.modelFactory.instanciateReference(type, it));
                        });
                    } else {
                        if (item[key]) refValue = this.modelFactory.instanciateReference(type, item[key]);
                    }
                    instance[key] = refValue;
                } else {
                    instance[key] = item[key];
                }
            } else if (key.indexOf('_') !== 0) {
                throw new Error(`Property '${key}' does not exist on model '${mf.collectionName}'`);
            }
        }
        if (options.deleteMissing) {
            // reinitialize deleted values
            for (let key of mf.$fields) {
                if (key[0] !== '_' && item[key] === undefined) {
                    instance[key] = undefined;
                }
            }
        }

        //console.log("FINAL INST:", instance);

    }

    getMetadata(instance: any, metadataName: string): any {
        return instance[metadataName];
    }
}