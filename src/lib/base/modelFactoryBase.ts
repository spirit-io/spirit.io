import { IModelActions, IModelHelper, IModelController, IModelFactory, IField, IRoute, IParameters, IValidator } from '../interfaces'
import { ModelActionsBase, ModelControllerBase, ModelHelperBase } from '.';
import { Registry } from '../core';
import { helper as objectHelper } from '../utils';
import { InstanceError } from '../utils';
import { context } from 'f-promise';
import { orm } from './plugin';
import * as SNS from 'seneca';
import { Seneca } from '../core';
import * as debug from 'debug';

const factoryTrace = debug('sio:factory');
const validatorsTrace = debug('sio:validators');

class Field implements IField {
    name: string;
    type: string;
    metadatas: string[] = [];

    isPlural: boolean = false;
    isReference: boolean = false;
    isReverse: boolean = false;
    isEmbedded: boolean = false;
    isReadOnly: boolean = false;
    isInsertOnly: boolean = false;
    isEnum: string = undefined;
    private _invisible: boolean | Function;


    constructor(key: string, factory: IModelFactory) {
        this.name = key;
        if (factory.$plurals.indexOf(key) !== -1) this.isPlural = true;
        if (factory.$references.hasOwnProperty(key)) {
            this.isReference = true;
            if (factory.$references[key].$reverse) this.isReverse = true;
        }

        let metaContainer = Array.isArray(factory.$prototype[key]) ? factory.$prototype[key][0] : factory.$prototype[key];
        if (typeof metaContainer === 'object') {
            if (factory.$prototype.hasOwnProperty(key)) {
                this.type = metaContainer.type;
                this.isReadOnly = metaContainer.readOnly;
                this.isEnum = metaContainer.isEnum;
                this.isInsertOnly = metaContainer.insertOnly;
                this.isEmbedded = metaContainer.embedded;
                this._invisible = metaContainer.invisible != null ? metaContainer.invisible : false;
            }
            this.metadatas = Object.keys(metaContainer).filter((key) => {
                return ['type', 'ref', 'embedded', 'invisible', 'readOnly'].indexOf(key) === -1;// && (!factory.connector || !factory.connector.ignoreValidators || factory.connector.ignoreValidators.indexOf(key) === -1);
            });
        }
    }

    isVisible(instance: any): boolean {
        if (this._invisible == null) return true;
        if (typeof this._invisible === 'boolean') {
            return !<boolean>this._invisible;
        } else {
            return !this._invisible(instance);
        }
    }

    hasMetadata(name: string): boolean {
        return this.metadatas.indexOf(name) !== -1;
    }

    toJSON() {
        return {
            name: this.name,
            type: this.type,
            metadatas: this.metadatas,
            isPlural: this.isPlural,
            isReference: this.isReference,
            isReverse: this.isReverse,
            isEmbedded: this.isEmbedded,
            isReadOnly: this.isReadOnly,
            isInsertOnly: this.isInsertOnly,
            isEnum: this.isEnum
        };
    }
}


/**
 * This is an abstract class, so every spirit.io connector MUST provide a ModelFactory class that inherit of this base class.
 */
export class ModelFactoryBase implements IModelFactory {

    public targetClass: any;
    public collectionName: string;
    // public connector: IConnector;
    public entity: SNS.Entity;
    public $properties: string[];
    public $statics: string[];
    public $methods: string[];
    public $routes: IRoute[]
    public $fields: Map<string, IField>;
    public $plurals: string[];
    public $references: any;
    public $prototype: Object;
    public $hooks: Map<string, Function>;
    public actions: IModelActions;
    public helper: IModelHelper;
    public controller: IModelController;
    public datasource: string;
    public persistent: boolean = true;
    public validators: IValidator[];
    public linkedFactory: string = null;

    constructor(name: string, targetClass: any, options?: any) {
        options = options || {};
        this.collectionName = name;
        this.targetClass = targetClass;
        // this.connector = connector;
        this.linkedFactory = options.linkedFactory;

        let tempFactory = this.targetClass.__factory__[this.collectionName];
        this.persistent = tempFactory.persistent != null ? tempFactory.persistent : true;
        this.datasource = tempFactory.datasource || context().__defaultDatasource;
        this.validators = tempFactory.validators || [];

        this.$prototype = tempFactory.$prototype || {};
        this.$properties = tempFactory.$properties || [];
        this.$plurals = tempFactory.$plurals || [];
        this.$statics = tempFactory.$statics || [];
        this.$methods = tempFactory.$methods || [];
        this.$routes = tempFactory.$routes || [];
        this.$references = tempFactory.$references || {};
        this.$hooks = tempFactory.$hooks || new Map();
        this.$fields = new Map();

    }

    init(actions: IModelActions, helper: IModelHelper, controller: IModelController): void {

        // compute fields
        this.$properties.concat(Object.keys(this.$references)).forEach((key) => {
            let field: Field = new Field(key, this);
            field.metadatas.forEach((m) => {
                // ignore if connector already considered
                if (this.validators.some((v) => {
                    return v.name === m;
                })) return;

                validatorsTrace(`${this.collectionName}: Try to find a validator for metadata '${m}'`)
                // consider validator if available on the connector
                // else consider the validator if available in the registry

                /*
                let vc = this.connector && this.connector.getValidator(m);

                if (vc) {
                    validatorsTrace(`Validator found on connector`);
                    this.validators.push(vc);
                } else {

                    */
                let vr = Registry.getValidator(m);
                if (vr) {
                    validatorsTrace(`Validator found in registry`);
                    this.validators.push(vr);
                } else {
                    validatorsTrace(`No validator found...`);
                }
                // }
            });
            // register field
            this.$fields.set(key, field);
        });

        this.actions = actions;
        this.helper = helper;
        this.controller = controller;

        factoryTrace(`============= Model registered '${this.linkedFactory || this.collectionName}' on datasource '${this.datasource}:${this.collectionName}' =============`);
        factoryTrace(`Prototype: ${require('util').inspect(this.$prototype, null, 2)}`);
        factoryTrace("=========================================================================");
    }



    getModelFactoryByPath(path: string): IModelFactory {
        let _treeEntry = this.$prototype[path];
        let _ref = _treeEntry ? (Array.isArray(_treeEntry) ? _treeEntry[0].ref : _treeEntry.ref) : null;
        if (!_ref) throw new Error(`path '${path}' not found in '${this.collectionName}' factory's prototype`);

        // specifying model when populate is necessary for multiple database usage
        let mf = Registry.getFactory(_ref);
        if (!mf) throw new Error(`Class hasn't been registered for model '${path}'.`);
        return mf;
    }

    getReferenceType(refName: string): string {
        let typeIsPlural = this.$plurals.indexOf(refName) !== -1;
        return this.$prototype[refName] && (typeIsPlural ? this.$prototype[refName][0] && this.$prototype[refName][0].ref : this.$prototype[refName].ref);
    }

    createNew(data?: any, type?: string): any {
        let mf = type == null ? this : Registry.getFactory(type);
        let constructor = mf.targetClass.prototype.constructor;
        if (data instanceof constructor) {
            return data;
        } else if (typeof data === 'string') {
            data = {
                id: data
            };
        }
        //console.log(`Instanciate reference ${type} with data: ${require('util').inspect(data, null, 2)}`);
        let inst = new constructor();
        if (data) mf.helper.updateValues(inst, data, { deleteMissing: true });
        return inst;
    }

    getHookFunction(name: string): Function {
        return this.$hooks.get(name);
    }

    populateField(parameters: IParameters = {}, item: any = {}, key: string): void {
        let include = parameters.includes && parameters.includes.filter((i) => { return i.path === key; })[0];
        if (include && item && item[key] != null) {
            let mf = this.getModelFactoryByPath(key);
            let relValue;
            if (Array.isArray(item[key])) {
                relValue = [];
                item[key].forEach((id) => {
                    let ref = mf.actions.read(id);
                    if (include.select) {
                        let data = { id: ref.id };
                        data[include.select] = ref[include.select];
                        relValue.push(data);
                    } else {
                        relValue.push(ref);
                    }
                });
            } else {
                let ref = mf.actions.read(item[key]);
                if (include.select) {
                    let data = { id: ref.id };
                    data[include.select] = ref[include.select];
                    relValue = data;
                } else {
                    relValue = ref;
                }
            }
            item[key] = relValue;
        }
    }

    simplifyReferences(item: any): any {
        let transformed = objectHelper.clone(item, true);
        Object.keys(this.$references).forEach((key) => {
            if (transformed && transformed[key] != null) {
                let relValue;
                if (Array.isArray(transformed[key])) {
                    relValue = [];
                    transformed[key].forEach((it) => {
                        if (typeof it === 'object' && it.id) relValue.push(it.id);
                        else relValue.push(it);
                    });
                } else {
                    if (typeof transformed[key] === 'object' && transformed[key].id) relValue = transformed[key].id;
                    else relValue = transformed[key];
                }
                transformed[key] = relValue;
            }
        });
        return transformed;
    }

    validate(instance: any): void {
        this.validators.every((validator) => {
            return validator.validate(instance, this);
        });
        if (instance.$diagnoses && instance.$diagnoses.some((diag) => {
            return diag.$severity === 'error';
        })) {
            validatorsTrace("Validation failed:", JSON.stringify(instance.$diagnoses, null, 2));
            throw new InstanceError('Validation Error', instance.$diagnoses);
        }
    }





    setup(): void {
        this.init(new ModelActionsBase(this), new ModelHelperBase(this), new ModelControllerBase(this));
        Seneca.instance.use(orm, { factory: this });
    }


}


export class NonPersistentModelFactory extends ModelFactoryBase implements IModelFactory {
    constructor(name: string, targetClass: any) {
        super(name, targetClass);
    }
    setup() {
        super.init(null, null, new ModelControllerBase(this));
        Seneca.instance.use(orm, { factory: this });
    }
}