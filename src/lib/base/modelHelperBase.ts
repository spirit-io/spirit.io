import { IModelFactory, IModelHelper, IParameters, ISerializeOptions } from '../interfaces';
import { AdminHelper } from '../core';
import { helper as objectHelper } from '../utils';

let trace;// = console.log;

export abstract class ModelHelperBase implements IModelHelper {

    public modelFactory: IModelFactory;
    constructor(modelFactory: IModelFactory) {
        this.modelFactory = modelFactory;
    }

    private _patchParameters(parameters?: IParameters, serializeOptions?: ISerializeOptions) {
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

    fetchInstances(filter?: any, parameters?: IParameters, serializeOptions?: ISerializeOptions) {
        trace && trace("\n\n\n## Fetch instances ##");
        parameters = this._patchParameters(parameters, serializeOptions);
        let instances: any = [];
        let docs = this.modelFactory.actions.query(filter, parameters);
        for (var doc of docs) {
            let inst = new this.modelFactory.targetClass.prototype.constructor();
            this.updateValues(inst, doc);
            instances.push(serializeOptions ? this.serialize(inst, parameters, serializeOptions) : inst);
        }
        return instances;
    }

    fetchInstance(filter: any, parameters?: IParameters, serializeOptions?: ISerializeOptions) {
        trace && trace("\n\n\n## Fetch instance ##");
        parameters = this._patchParameters(parameters, serializeOptions);
        let doc = this.modelFactory.actions.read(filter, parameters);


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

    saveInstance(instance: any, data?: any, options?: IParameters, serializeOptions?: ISerializeOptions) {
        trace && trace("\n\n\n## Save instance ##");
        if (!instance._id) instance.$isCreated = true;
        options = this._patchParameters(options, serializeOptions);
        if (data) this.updateValues(instance, data, { deleteMissing: options.deleteMissing || false });
        let item;
        if (instance._id) {
            instance.$snapshot = this.fetchInstance(instance._id);
        } else {
            instance.$isCreated;
        }
        // Call beforeSave hook
        this.applyHook('beforeSave', instance);

        // special options are needed for pre update serialization
        let customSerializeOptions = serializeOptions ? objectHelper.clone(serializeOptions) : {};
        customSerializeOptions.ignorePostSerialization = true;
        let serialized = this.serialize(instance, null, customSerializeOptions);

        if (!instance.$isCreated) {
            options.deleteReadOnly = true;
            item = this.modelFactory.actions.update(instance._id, serialized, options);
        } else {
            // deleteMissing will force required validation
            options.deleteMissing = true;
            item = this.modelFactory.actions.create(serialized, options);
        }

        this.updateValues(instance, item, { deleteMissing: true });
        this.applyHook('afterSave', instance);
        if (!serializeOptions) return instance;
        return this.serialize(instance, null, serializeOptions);
    }

    deleteInstance(instance: any): any {
        return this.modelFactory.actions.delete(instance._id);
    }

    serialize(instance: any, parameters?: IParameters, options?: ISerializeOptions): any {
        options = options || {};
        parameters = parameters || {};
        // consider correct modelFactory (for relation potentially)
        let mf: IModelFactory = options.modelFactory || this.modelFactory;
        let item: any = {};

        let includes = parameters.includes ? parameters.includes.map((i) => { return typeof i === 'object' ? i.path : i }) : [];

        trace && trace("********** Begin serialization *************");
        //console.log("Instance: ", require('util').inspect(instance, null, 2));


        // first loop is done to consider every fields
        for (var [key, field] of mf.$fields) {
            trace && trace("====== Field ", key);
            if (instance[key] !== undefined) {
                // References
                if (field.isReference && typeof instance[key] === 'object') {
                    if (field.isPlural) {
                        trace && trace("Plural ref ", key);
                        instance[key] = Array.isArray(instance[key]) ? instance[key] : [instance[key]];
                        let notInclude = options.serializeRef && includes.indexOf(key) === -1;


                        item[key] = instance[key].map(function (inst) {
                            //only ids if reference serialization is not expected and it is not embedded
                            if (notInclude && typeof inst === 'object' && inst._id && !field.isEmbedded) {
                                trace && trace("Not include ref ", key);
                                return inst._id;
                            }
                            // serialize reference
                            else {
                                trace && trace("Include ref ", key);
                                let _db = AdminHelper.model(inst.constructor);
                                let sRef = _db.serialize(inst, null, options);
                                if (sRef && sRef._id || field.isEmbedded) return sRef;
                            }
                            return null;
                        }).filter((inst) => { return inst != null });
                    } else {
                        trace && trace("Singular ", key);
                        // only ids if reference serialization is not expected and it is not embedded
                        if (options.serializeRef && includes.indexOf(key) === -1 && instance[key]._id && !field.isEmbedded) {
                            trace && trace("Not include ref ", key);
                            item[key] = instance[key]._id;
                        }
                        // serialize reference
                        else {
                            trace && trace("Include ref ", key);
                            let _db = AdminHelper.model(instance[key].constructor);
                            let sRef = _db.serialize(instance[key], null, options);
                            if (sRef && sRef._id || field.isEmbedded) item[key] = sRef
                        }
                    }
                }
                // serialize as it is
                else {
                    trace && trace("Simple prop ", key);
                    item[key] = instance[key];
                }

            }
            else {
                trace && trace("IGNORE Field ", key);
            }
        }


        if (!options.ignorePostSerialization) {
            // A second loop is done for post serialization validation
            for (let [key, field] of mf.$fields) {
                if (item[key] != null) {
                    if (!field.isVisible(instance)) {
                        delete item[key];
                    }
                }
            }
        }

        trace && trace("Serialize:", item);
        trace && trace("********** End serialization *************\n");

        return item;
    }

    updateValues(instance: any, item: any, options?: any): void {
        trace && trace("## Update values ##");
        if (!instance || !item) return null;
        options = options || {};
        // consider correct modelFactory (for relation potentially)
        let mf: IModelFactory = options.modelFactory || this.modelFactory;
        // update new values
        for (let key of Object.keys(item)) {
            if (mf.$fields.has(key)) {
                trace && trace(`Update key ${key} with value: ${require('util').inspect(item[key], null, 1)}`)

                // instanciate references
                if (this.modelFactory.$references[key]) {
                    let type = this.modelFactory.getReferenceType(key);
                    let refValue;
                    if (Array.isArray(item[key])) {
                        refValue = [];
                        if (item[key].length) {
                            item[key].forEach((it) => {
                                if (it) refValue.push(this.modelFactory.createNew(it, type));
                            });
                        }
                    } else {
                        if (item[key]) refValue = this.modelFactory.createNew(item[key], type);
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
            for (var [key, field] of mf.$fields) {
                if (!field.isReadOnly && item[key] === undefined) {
                    instance[key] = undefined;
                }
            }
        }
    }

    applyHook(name: string, instance: any) {
        let fn: Function = this.modelFactory.getHookFunction(name);
        if (!fn) return;
        try {
            instance.__hooksRunning = instance.__hooksRunning || {};
            if (!instance.__hooksRunning[name]) {
                instance.__hooksRunning[name] = true;
                fn(instance);
            }
        } catch (e) {
            throw new Error(`An error occured while applying hook '${name}: ${e.message} ${e.stack}`);
        } finally {
            delete instance.__hooksRunning[name];
        }
    }

    getMetadata(instance: any, metadataName: string): any {
        return instance[metadataName];
    }

    isModified(instance: any, property: string): boolean {
        if (!instance.$snapshot) return false;
        return instance[property] === undefined || instance[property] !== instance.$snapshot[property];
    }
}