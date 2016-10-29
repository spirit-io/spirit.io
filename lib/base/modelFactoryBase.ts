import { _ } from 'streamline-runtime';
import { Router, RequestHandler } from 'express';
import { IModelFactory, IModelActions, IModelHelper, IModelController } from '../interfaces'
import { ModelHelperBase, ModelControllerBase } from '../base';

let trace;// = console.log;

export abstract class ModelFactoryBase implements IModelFactory {

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

    setup (routers: Map<string, Router>, actions: IModelActions, helper: IModelHelper, controller: IModelController) {
        trace && trace(`Schema registered for collection ${this.collectionName}: ${require('util').inspect(this.$prototype,null,2)}`)
        
        this.$fields = this.$properties.concat(Object.keys(this.$references));  

        this.actions = actions;
        this.helper = helper;    
        this.controller = controller;
        let routeName = this.collectionName.substring(0,1).toLowerCase() + this.collectionName.substring(1);
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

}