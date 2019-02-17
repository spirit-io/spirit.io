import { IModelFactory, IModelHelper, IParameters, ISerializeOptions, IField } from '../interfaces';
import { AdminHelper } from '../core';
import { helper as objectHelper } from '../utils/object';
import * as diagsHelper from '../utils/diags';

const trace: any = undefined; // console.log;

export abstract class ModelHelperBase implements IModelHelper {

    public modelFactory: IModelFactory;
    protected constructor(modelFactory: IModelFactory) {
        this.modelFactory = modelFactory;
    }

    public fetchInstances(filter?: any, parameters?: IParameters, serializeOptions?: ISerializeOptions) {
        trace && trace('\n\n\n## Fetch instances ##');
        const patchedParameters = this._patchParameters(parameters, serializeOptions);
        const instances: any = [];
        const docs = this.modelFactory.actions.query(filter, patchedParameters);
        for (const doc of docs) {
            const inst = new this.modelFactory.targetClass.prototype.constructor();
            this.updateValues(inst, doc);
            instances.push(serializeOptions ? this.serialize(inst, patchedParameters, serializeOptions) : inst);
        }
        return instances;
    }

    public fetchInstance(filter: any, parameters?: IParameters, serializeOptions?: ISerializeOptions) {
        trace && trace('\n\n\n## Fetch instance ##');
        const patchedParameters = this._patchParameters(parameters, serializeOptions);
        const doc = this.modelFactory.actions.read(filter, patchedParameters);

        if (!doc) return null;
        let inst;
        if (patchedParameters && patchedParameters.ref) {
            const refFactory = this.modelFactory.getModelFactoryByPath(patchedParameters.ref);
            inst = new refFactory.targetClass.prototype.constructor();
            this.updateValues(inst, doc, { modelFactory: refFactory });
            if (serializeOptions) serializeOptions.modelFactory = refFactory;
        } else {
            inst = new this.modelFactory.targetClass.prototype.constructor();
            this.updateValues(inst, doc);
        }
        return serializeOptions ? this.serialize(inst, patchedParameters, serializeOptions) : inst;
    }

    public saveInstance(instance: any, data?: any, parameters?: IParameters, serializeOptions?: ISerializeOptions) {
        trace && trace('\n\n\n## Save instance ##');
        if (!instance._id) instance.$isCreated = true;
        const patchedParameters = this._patchParameters(parameters, serializeOptions);
        if (data) this.updateValues(instance, data, { deleteMissing: patchedParameters.deleteMissing || false });
        let item;
        if (instance._id) {
            instance.$snapshot = this.fetchInstance(instance._id);
        } else {
            instance.$isCreated = true;
        }
        // Call beforeSave hook
        this.applyHook('beforeSave', instance);

        // Call validate function on every validators concerned
        this.modelFactory.validate(instance);

        // special options are needed for pre update serialization
        const customSerializeOptions = serializeOptions ? objectHelper.clone(serializeOptions) : {};
        customSerializeOptions.ignorePostSerialization = true;
        const serialized = this.serialize(instance, undefined, customSerializeOptions);

        if (!instance.$isCreated) {
            patchedParameters.deleteReadOnly = true;
            item = this.modelFactory.actions.update(instance._id, serialized, patchedParameters);
        } else {
            // deleteMissing will force required validation
            patchedParameters.deleteMissing = true;
            item = this.modelFactory.actions.create(serialized, patchedParameters);
        }

        this.updateValues(instance, item, { deleteMissing: true });
        this.applyHook('afterSave', instance);
        if (!serializeOptions) return instance;
        return this.serialize(instance, undefined, serializeOptions);
    }

    public deleteInstance(instance: any): any {
        return this.modelFactory.actions.delete(instance._id);
    }

    public serialize(instance: any, parameters: IParameters = {}, options: ISerializeOptions = {}): any {
        // consider correct modelFactory (for relation potentially)
        const mf: IModelFactory = options.modelFactory || this.modelFactory;
        const item: any = {};

        const includes = parameters.includes ? parameters.includes.map(i => typeof i === 'object' ? i.path : i) : [];

        trace && trace('********** Begin serialization *************');
        // console.log("Instance: ", require('util').inspect(instance, null, 2));

        // first loop is done to consider every fields
        for (const [key, field] of mf.$fields) {
            trace && trace('====== Field ', key);
            if (instance[key] !== undefined) {
                // References
                if (field.isReference && typeof instance[key] === 'object') {
                    if (field.isPlural) {
                        trace && trace('Plural ref ', key);
                        instance[key] = Array.isArray(instance[key]) ? instance[key] : [instance[key]];
                        const notInclude = options.serializeRef && includes.indexOf(key) === -1;

                        item[key] = instance[key].map((inst) => {
                            // only ids if reference serialization is not expected and it is not embedded
                            if (notInclude && typeof inst === 'object' && inst._id && !field.isEmbedded) {
                                trace && trace('Not include ref ', key);
                                return inst._id;
                            }  {
                                trace && trace('Include ref ', key);
                                const _db = AdminHelper.model(inst.constructor);
                                const sRef = _db.serialize(inst, undefined, options);
                                if (sRef && sRef._id || field.isEmbedded) return sRef;
                            }
                            return null;
                        }).filter(inst => inst != null);
                    } else {
                        trace && trace('Singular ', key);
                        // only ids if reference serialization is not expected and it is not embedded
                        if (options.serializeRef && includes.indexOf(key) === -1 && instance[key]._id && !field.isEmbedded) {
                            trace && trace('Not include ref ', key);
                            item[key] = instance[key]._id;
                        } else {
                            trace && trace('Include ref ', key);
                            const _db = AdminHelper.model(instance[key].constructor);
                            const sRef = _db.serialize(instance[key], undefined, options);
                            if (sRef && sRef._id || field.isEmbedded) item[key] = sRef;
                        }
                    }
                } else {
                    trace && trace('Simple prop ', key);
                    item[key] = instance[key];
                }

            } else {
                trace && trace('IGNORE Field ', key);
            }
        }

        if (!options.ignorePostSerialization) {
            // A second loop is done for post serialization validation
            for (const [key, field] of mf.$fields) {
                if (item.hasOwnProperty(key)) {
                    if (!field.isVisible(instance)) {
                        delete item[key];
                    }
                    if (field.isEnum && typeof item[key] === 'number') {
                        // transcript enum value
                        item[key] = AdminHelper.enum(field.isEnum)[item[key]];
                    }
                }
            }
        }

        if (instance.$diagnoses && instance.$diagnoses.length) {
            item.$diagnoses = instance.$diagnoses;
        }
        trace && trace('Serialize:', item);
        trace && trace('********** End serialization *************\n');

        return item;
    }

    public updateValues(instance: any, item: any, options: any = {}): void {
        trace && trace('## Update values ##');
        if (!instance || !item) return;
        // consider correct modelFactory (for relation potentially)
        const mf: IModelFactory = options.modelFactory || this.modelFactory;
        // update new values
        for (const key of Object.keys(item)) {
            const field: IField | undefined = mf.$fields.get(key);
            if (field) {
                if (!field.isReadOnly) {
                    trace && trace(`Update key ${key} with value: ${require('util').inspect(item[key], null, 1)}`);
                    // instanciate references
                    if (this.modelFactory.$references[key]) {
                        const type = this.modelFactory.getReferenceType(key);
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
                    } else if (field.isEnum) {
                        const enu = AdminHelper.enum(field.isEnum);
                        if (enu[item[key]] == null) {
                            throw new Error(`Invalid value for property '${key}'. It should be a value from '${field.isEnum}' enum.`);
                        }
                        instance[key] = typeof item[key] === 'number' ? item[key] : enu[item[key]];
                    } else {
                        instance[key] = item[key];
                    }
                } else if (item[key] !== instance[key]) {
                    diagsHelper.addInstanceDiagnose(instance, 'warn',
                        `Property '${key}' is readOnly and can't be modified. New value ignored: '${item[key]}'; Old value kept: '${instance[key]}'`);
                }
            } else if (key.indexOf('_') !== 0 && key.indexOf('$') !== 0) {
                throw new Error(`Property '${key}' does not exist on model '${mf.collectionName}'`);
            }
        }
        // reinitialize deleted values
        for (const [key, field] of mf.$fields) {
            // console.log("Field:", JSON.stringify(field,null,2))
            if (options.deleteMissing) {
                if (!field.isInsertOnly && item[key] === undefined) {
                    instance[key] = undefined;
                }
            }
        }

        // // reinitialize deleted values
        // for (var [key, field] of mf.$fields) {
        //     if (options.deleteMissing) {
        //         if (!field.isInsertOnly && item[key] === undefined) {
        //             instance[key] = undefined;
        //         }
        //     }
        //     if (instance[key] !== undefined && instance.$snapshot && field.isReadOnly) {
        //         instance[key] = undefined;
        //     }
        // }

    }

    public applyHook(name: string, instance: any) {
        const fn = this.modelFactory.getHookFunction(name);
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

    public getMetadata(instance: any, metadataName: string): any {
        return instance[metadataName];
    }

    public isModified(instance: any, property: string): boolean {
        if (!instance.$snapshot) return false;
        return instance[property] === undefined || instance[property] !== instance.$snapshot[property];
    }

    private _patchParameters(parameters?: IParameters, serializeOptions: ISerializeOptions = {}) {
        // force to include all references when ignoreRef is not declared
        const patchedParameters = parameters || {};
        if (!serializeOptions.serializeRef && !patchedParameters.includes) {
            const includes: any[] = [];
            Object.keys(this.modelFactory.$references).forEach((ref) => {
                includes.push(ref);
            });
            patchedParameters.includes = includes.join(',');
        }

        // transform includes to array of objects
        patchedParameters.includes = this._parseIncludes(patchedParameters.includes);
        return patchedParameters;
    }

    private _parseIncludes(includes: any): any[] {
        function parseIncludesStr(_includes) {
            function parseIncludeStr(_include) {
                const opt: any = {};
                if (_include.indexOf('.') !== -1) {
                    const parts = _include.split('.');
                    opt.path = parts[0];
                    opt.select = parts[1];
                } else {
                    opt.path = _include;
                }
                transformed.push(opt);
            }
            const transformed: any[] = [];

            if (_includes.indexOf(',') !== -1) {
                _includes.split(',').forEach((i) => {
                    parseIncludeStr(i);
                });
            } else {
                parseIncludeStr(_includes);
            }
            return transformed;
        }
        if (includes == null) return [];

        let result: any[] = [];
        if (typeof includes !== 'object' && (includes.charAt(0) === '{' || includes.charAt(0) === '[')) {
            try {
                result = JSON.parse(includes);
                return Array.isArray(result) ? result : [result];
            } catch (err) {
                throw new Error('JSON includes filter is not valid');
            }
        }

        // transform parameter to array of objects
        if (typeof includes === 'string') {
            return parseIncludesStr(includes);
        }
        if (!Array.isArray(includes)) {
            return [includes];
        }

        return [];
    }
}
