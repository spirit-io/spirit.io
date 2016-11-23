import { _ } from 'streamline-runtime';
import { Router, RequestHandler } from 'express';
import { IModelActions, IModelHelper, IModelController, IModelFactory, IField } from '../interfaces'
import { ModelHelperBase, ModelControllerBase } from '../base';
import { ModelRegistry } from '../core';

let trace = console.log;


class Field implements IField {
    name: string;
    isPlural: boolean = false;
    isReference: boolean = false;
    isReverse: boolean = false;
    isEmbedded: boolean = false;
    isReadOnly: boolean = false;
    isUnique: boolean = false;
    isRequired: boolean = false;
    isIndexed: boolean = false;

    constructor(key: string, factory: IModelFactory) {
        this.name = key;
        if (factory.$plurals.indexOf(key) !== -1) this.isPlural = true;
        if (factory.$references.hasOwnProperty(key)) {
            this.isReference = true;
            if (factory.$references[key].$reverse) this.isReverse = true;
        }

        if (factory.$prototype.hasOwnProperty(key)) {
            this.isReadOnly = factory.$prototype[key].readOnly;
            this.isEmbedded = factory.$prototype[key].embedded;
            this.isUnique = factory.$prototype[key].unique;
            this.isRequired = factory.$prototype[key].required;
            this.isIndexed = factory.$prototype[key].index;
        }
    }
}

export abstract class ModelFactoryBase implements IModelFactory {

    public targetClass: any;
    public collectionName: string;
    public $properties: string[];
    public $statics: string[];
    public $methods: string[];
    public $fields: Map<string, IField>;

    public $readOnly: string[];
    public $plurals: string[];
    public $references: any;
    public $prototype: Object;
    public actions: IModelActions;
    public helper: IModelHelper;
    public controller: IModelController;
    public datasource: string;

    constructor(name: string, targetClass: any) {
        this.collectionName = name;
        this.targetClass = targetClass;
        let tempFactory = targetClass.__factory__[name];
        this.$prototype = tempFactory.$prototype || {};
        this.$properties = tempFactory.$properties || [];
        this.$plurals = tempFactory.$plurals || [];
        this.$statics = tempFactory.$statics || [];
        this.$methods = tempFactory.$methods || [];
        this.$references = tempFactory.$references || {};
        this.$fields = new Map();
    }

    init(routers: Map<string, Router>, actions: IModelActions, helper: IModelHelper, controller: IModelController): void {
        trace && trace(`Prototype registered for collection ${this.collectionName}: ${require('util').inspect(this.$prototype, null, 2)}`)
        this.$properties.concat(Object.keys(this.$references)).forEach((key) => {
            this.$fields.set(key, new Field(key, this));
        });
        this.actions = actions;
        this.helper = helper;
        this.controller = controller;
        let routeName = this.collectionName.substring(0, 1).toLowerCase() + this.collectionName.substring(1);
        let v1 = routers.get('v1');
        if (this.actions) {
            trace && trace(`Register routes: /${routeName}`);
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

        if (this.helper) {
            // handle execution requests
            v1.post(`/${routeName}/([\$])service/:_name`, this.controller.executeService);
            v1.post(`/${routeName}/:_id/([\$])execute/:_name`, this.controller.executeMethod);
        }
    }

    getModelFactoryByPath(path: string): IModelFactory {
        let _treeEntry = this.$prototype[path];
        let _ref = _treeEntry ? (Array.isArray(_treeEntry) ? _treeEntry[0].ref : _treeEntry.ref) : null;
        if (!_ref) throw new Error(`path '${path}' not found in '${this.collectionName}' factory's schema`);

        // specifying model when populate is necessary for multiple database usage
        let mf = ModelRegistry.getFactoryByName(_ref);
        if (!mf) throw new Error(`Class hasn't been registered for model '${path}'.`);
        return mf;
    }

    getReferenceType(refName: string): string {
        let typeIsPlural = this.$plurals.indexOf(refName) !== -1;
        return this.$prototype[refName] && (typeIsPlural ? this.$prototype[refName][0] && this.$prototype[refName][0].ref : this.$prototype[refName].ref);
    }

    instanciateReference(type: string, data: any): any {
        let mf = ModelRegistry.getFactoryByName(type);
        let constructor = mf.targetClass.prototype.constructor;
        if (data instanceof constructor) {
            return data;
        } else if (typeof data === 'string') {
            data = {
                _id: data
            };
        }
        //console.log(`Instanciate reference ${type} with data: ${require('util').inspect(data, null, 2)}`);
        let inst = new constructor();
        if (data) mf.helper.updateValues(inst, data, { deleteMissing: true });
        return inst;
    }

    abstract createSchema(): any;
    abstract setup(routers: Map<string, Router>): void;


}