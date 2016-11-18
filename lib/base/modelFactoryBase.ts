import { _ } from 'streamline-runtime';
import { Router, RequestHandler } from 'express';
import { IModelActions, IModelHelper, IModelController, IModelFactory } from '../interfaces'
import { ModelHelperBase, ModelControllerBase } from '../base';
import { ModelRegistry } from '../core';

let trace;// = console.log;

export abstract class ModelFactoryBase {

    public targetClass: any;
    public collectionName: string;
    public $properties: string[];
    public $statics: string[];
    public $methods: string[];
    public $fields: string[];
    public $plurals: string[];
    public $references: any;
    public $prototype: Object;
    public actions: IModelActions;
    public helper: IModelHelper;
    public controller: IModelController;
    public datasource: string;

    constructor(targetClass: any) {
        this.collectionName = targetClass._collectionName;
        this.targetClass = targetClass;
        this.$prototype = targetClass.__factory__.$prototype || {};
        this.$properties = targetClass.__factory__.$properties || [];
        this.$plurals = targetClass.__factory__.$plurals || [];
        this.$statics = targetClass.__factory__.$statics || [];
        this.$methods = targetClass.__factory__.$methods || [];
        this.$references = targetClass.__factory__.$references || {};

    }

    setup(routers: Map<string, Router>, actions: IModelActions, helper: IModelHelper, controller: IModelController) {
        trace && trace(`Schema registered for collection ${this.collectionName}: ${require('util').inspect(this.$prototype, null, 2)}`)
        this.$fields = this.$properties.concat(Object.keys(this.$references));

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
        if (data) mf.helper.updateValues(inst, data);
        return inst;
    }


}