import { NextFunction, Request, Response, Router } from 'express';
import { context, run } from 'f-promise';
import * as debug from 'debug';

import { IConnector, IField, IModelActions, IModelController, IModelFactory, IModelHelper, IParameters, IRoute, IValidator } from '../interfaces';
import { Registry } from '../core';
import { helper as objectHelper, InstanceError } from '../utils';

const factoryTrace = debug('sio:factory');
const validatorsTrace = debug('sio:validators');

class Field implements IField {
    public name: string;
    public type: string;
    public metadatas: string[] = [];

    public isPlural: boolean = false;
    public isReference: boolean = false;
    public isReverse: boolean = false;
    public isEmbedded: boolean = false;
    public isReadOnly: boolean = false;
    public isInsertOnly: boolean = false;
    public isEnum: string | undefined = undefined;

    private readonly  _invisible: boolean | Function;

    constructor(key: string, factory: IModelFactory) {
        this.name = key;
        if (factory.$plurals.indexOf(key) !== -1) this.isPlural = true;
        if (factory.$references.hasOwnProperty(key)) {
            this.isReference = true;
            if (factory.$references[key].$reverse) this.isReverse = true;
        }

        const metaContainer = Array.isArray(factory.$prototype[key]) ? factory.$prototype[key][0] : factory.$prototype[key];
        if (typeof metaContainer === 'object') {
            if (factory.$prototype.hasOwnProperty(key)) {
                this.type = metaContainer.type;
                this.isReadOnly = metaContainer.readOnly;
                this.isEnum = metaContainer.isEnum;
                this.isInsertOnly = metaContainer.insertOnly;
                this.isEmbedded = metaContainer.embedded;
                this._invisible = metaContainer.invisible != null ? metaContainer.invisible : false;
            }
            this.metadatas = Object.keys(metaContainer).filter((_key) => {
                return ['type', 'ref', 'embedded', 'invisible', 'readOnly']
                    .indexOf(_key) === -1 &&
                    (!factory.connector || !factory.connector.ignoreValidators || factory.connector.ignoreValidators.indexOf(_key) === -1);
            });
        }
    }

    public isVisible(instance: any): boolean {
        if (this._invisible == null) return true;
        if (typeof this._invisible === 'boolean') {
            return !this._invisible as boolean;
        }
        return !this._invisible(instance);
    }

    public hasMetadata(name: string): boolean {
        return this.metadatas.indexOf(name) !== -1;
    }

    public toJSON() {
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
            isEnum: this.isEnum,
        };
    }
}

/**
 * This is an abstract class, so every spirit.io connector MUST provide a ModelFactory class that inherit of this base class.
 */
export abstract class ModelFactoryBase implements IModelFactory {

    public targetClass: any;
    public collectionName: string;
    public connector: IConnector | undefined;
    public $properties: string[];
    public $statics: string[];
    public $methods: string[];
    public $routes: IRoute[];
    public $fields: Map<string, IField>;
    public $plurals: string[];
    public $references: any;
    public $prototype: Object;
    public $hooks: Map<string, () => any>;
    public actions: IModelActions;
    public helper: IModelHelper;
    public controller: IModelController;
    public datasource: string;
    public persistent: boolean = true;
    public validators: IValidator[];
    public linkedFactory: string | undefined = undefined;

    protected constructor(name: string, targetClass: any, connector?: IConnector, options: any = {}) {
        this.collectionName = name;
        this.targetClass = targetClass;
        this.connector = connector;
        this.linkedFactory = options.linkedFactory;

        const tempFactory = this.targetClass.__factory__[this.collectionName];
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

    public init(actions: IModelActions, helper: IModelHelper, controller: IModelController): void {

        // compute fields
        this.$properties.concat(Object.keys(this.$references)).forEach((key) => {
            const field: Field = new Field(key, this);
            field.metadatas.forEach((m) => {
                // ignore if connector already considered
                if (this.validators.some((v) => {
                    return v.name === m;
                })) return;

                validatorsTrace(`${this.collectionName}: Try to find a validator for metadata '${m}'`);
                // consider validator if available on the connector
                // else consider the validator if available in the registry
                const vc = this.connector && this.connector.getValidator(m);

                if (vc) {
                    validatorsTrace(`Validator found on connector`);
                    this.validators.push(vc);
                } else {
                    const vr = Registry.getValidator(m);
                    if (vr) {
                        validatorsTrace(`Validator found in registry`);
                        this.validators.push(vr);
                    } else {
                        validatorsTrace(`No validator found...`);
                    }
                }
            });
            // register field
            this.$fields.set(key, field);
        });

        if (this.persistent) {
            this.actions = actions;
            this.helper = helper;
            this.controller = controller;
        }

        factoryTrace(`======= Model registered '${this.linkedFactory || this.collectionName}' ` +
            `on datasource '${this.datasource}:${this.collectionName}' =======`);
        factoryTrace(`Prototype: ${require('util').inspect(this.$prototype, null, 2)}`);
        // Register express routes
        this.setRoutes();
        factoryTrace('=========================================================================');
    }

    public getModelFactoryByPath(path: string): IModelFactory {
        const _treeEntry = this.$prototype[path];
        const _ref = _treeEntry ? (Array.isArray(_treeEntry) ? _treeEntry[0].ref : _treeEntry.ref) : null;
        if (!_ref) throw new Error(`path '${path}' not found in '${this.collectionName}' factory's prototype`);

        // specifying model when populate is necessary for multiple database usage
        const mf = Registry.getFactory(_ref);
        if (!mf) throw new Error(`Class hasn't been registered for model '${path}'.`);
        return mf;
    }

    public getReferenceType(refName: string): string {
        const typeIsPlural = this.$plurals.indexOf(refName) !== -1;
        return this.$prototype[refName] && (typeIsPlural ? this.$prototype[refName][0] && this.$prototype[refName][0].ref : this.$prototype[refName].ref);
    }

    public createNew(data?: any, type?: string): any {
        const mf = type == null ? this : Registry.getFactory(type);
        const constructor = mf.targetClass.prototype.constructor;
        if (data instanceof constructor) {
            return data;
        }
        const instance: any = typeof data === 'string' ? {
            _id: data,
        } : data;
        // console.log(`Instanciate reference ${type} with data: ${require('util').inspect(data, null, 2)}`);
        const inst = new constructor();
        if (instance && mf.helper) {
            mf.helper.updateValues(inst, instance, { deleteMissing: true });
        }
        return inst;
    }

    public getHookFunction(name: string): (() => any) | undefined {
        return this.$hooks.get(name);
    }

    public populateField(parameters: IParameters = {}, item: any = {}, key: string): void {
        const include = parameters.includes && parameters.includes.filter(i => i.path === key)[0];

        if (include && item && item[key] != null) {

            const mf = this.getModelFactoryByPath(key);
            let relValue;
            if (Array.isArray(item[key])) {
                relValue = [];
                item[key].forEach((id) => {
                    const ref = mf.actions.read(id);
                    if (include.select) {
                        const data = { _id: ref._id };
                        data[include.select] = ref[include.select];
                        relValue.push(data);
                    } else {
                        relValue.push(ref);
                    }
                });
            } else {
                const ref = mf.actions.read(item[key]);
                if (include.select) {
                    const data = { _id: ref._id };
                    data[include.select] = ref[include.select];
                    relValue = data;
                } else {
                    relValue = ref;
                }
            }
            item[key] = relValue;
        }
    }

    public simplifyReferences(item: any): any {
        const transformed = objectHelper.clone(item, true);
        Object.keys(this.$references).forEach((key) => {
            if (transformed && transformed[key] != null) {
                let relValue;
                if (Array.isArray(transformed[key])) {
                    relValue = [];
                    transformed[key].forEach((it) => {
                        if (typeof it === 'object' && it._id) relValue.push(it._id);
                        else relValue.push(it);
                    });
                } else {
                    if (typeof transformed[key] === 'object' && transformed[key]._id) relValue = transformed[key]._id;
                    else relValue = transformed[key];
                }
                transformed[key] = relValue;
            }
        });
        return transformed;
    }

    public validate(instance: any): void {
        this.validators.every((validator) => {
            return validator.validate(instance, this);
        });
        if (instance.$diagnoses && instance.$diagnoses.some((diag) => {
            return diag.$severity === 'error';
        })) {
            validatorsTrace('Validation failed:', JSON.stringify(instance.$diagnoses, null, 2));
            throw new InstanceError('Validation Error', instance.$diagnoses);
        }
    }

    public abstract setup(): void;

    private setRoutes() {
        // Do not register any route for linked factory
        if (this.linkedFactory) return;

        const routeName = this.collectionName.substring(0, 1).toLowerCase() + this.collectionName.substring(1);
        const v1: Router = Registry.getApiRouter('v1');

        if (this.persistent) {
            if (this.actions) {
                factoryTrace(`--> Register routes: /${routeName}`);
                // handle main requests
                v1.get(`/${routeName}`, this.controller.query);
                v1.get(`/${routeName}/:_id`, this.controller.read);
                v1.post(`/${routeName}`, this.controller.create);
                v1.put(`/${routeName}/:_id`, this.controller.update);
                v1.patch(`/${routeName}/:_id`, this.controller.patch);
                v1.delete(`/${routeName}/:_id`, this.controller.delete);
                // handle references requests
                v1.get(`/${routeName}/:_id/:_ref`, this.controller.read);
                v1.put(`/${routeName}/:_id/:_ref`, this.controller.update);
                v1.patch(`/${routeName}/:_id/:_ref`, this.controller.patch);
            }

            // handle instance functions
            v1.post(`/${routeName}/:_id/([\$])execute/:_name`, this.executeMethod.bind(this) as any);
        }

        // handle static functions (available also on non persistent classes)
        v1.post(`/${routeName}/([\$])service/:_name`, this.executeService.bind(this) as any);
        this.$routes.forEach((route: IRoute) => {
            const path = `/${routeName}${route.path}`;
            v1[route.method](path, route.fn);
        });
    }

    private executeService(req: Request, res: Response, next: NextFunction): void {
        run(() => {
            const _name: string = req.params._name;
            if (this.$statics.indexOf(_name) === -1 || !this.targetClass[_name]) {
                res.sendStatus(404);
                return;
            }
            const params = req.body;
            const result = this.targetClass[_name](params);
            res.json(result);
            next();
        }).catch((e) => {
            next(e);
        });
    }

    private executeMethod(req: Request, res: Response, next: NextFunction): void {
        run(() => {
            const _id: string = req.params._id;
            const _name: string = req.params._name;
            const inst = this.helper.fetchInstance(_id);
            if (this.$methods.indexOf(_name) === -1 || !inst || (inst && !inst[_name])) {
                res.sendStatus(404);
                return;
            }

            const params = req.body;
            const result = inst[_name](params);
            res.json(result);
            next();
        }).catch((e) => {
            next(e);
        });
    }

}

export class NonPersistentModelFactory extends ModelFactoryBase implements IModelFactory {
    constructor(name: string, targetClass: any, connector?: IConnector) {
        super(name, targetClass, connector);
    }
    public setup() {
        super.init({} as any, {} as any, {} as any);
    }
}
