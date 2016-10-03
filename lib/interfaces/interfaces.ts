import { _ } from 'streamline-runtime';
import express = require("express");

export interface IModelController {
    create: express.RequestHandler;
    update: express.RequestHandler;
    patch: express.RequestHandler;
    delete: express.RequestHandler;
    read: express.RequestHandler;
    query: express.RequestHandler;
    executeService?: express.RequestHandler;
    executeMethod?: express.RequestHandler;
}

export interface IModelFactory {
    targetClass: any;
    collectionName: string;
    datasource: string;
    $properties: string[];
    $references: string[];
    $fields: string[];
    $plurals: string[];
    $statics: string[];
    $methods: string[];
    schemaDef: Object;
    model: Object;
    actions: IModelActions;
    helper: IModelHelper;
    setup(mid: Map<string, express.Router>);
}

export interface IModelActions {
    query(_: _, filter?: any, parameters?: IQueryParameters): any;
    read(_: _, _id: string, parameters?: IQueryParameters): any;
    create(_: _, item: any): any;
    update(_: _, _id: string, item: any, options?: any): any;
    createOrUpdate(_: _, _id: any, item: any, options?: any): any;
    delete(_: _, _id: any): any;
}

export interface IModelHelper {
    fetchInstances(_, filter?: any): any[];
    fetchInstance(_, _id: string): any ;
    saveInstance(_, instance: any, options?: any): any;
    deleteInstance(_:_, instance: any): any;
    serialize(instance: any): any;
    updateValues(instance: any, item: any, options?: any): void;
    getMetadata(instance: any, metadataName: string): any;
}


export interface IConnector {
    datasource: string;
    config: any;
    connect(datasourceKey: string, parameters: any): any;
    createModelFactory(myClass: any): IModelFactory;
}

export interface IQueryParameters {
    includes?: string;
}

/**
 * @param name string A collection name if you don't want to use the Class name'
 */
export interface ICollection {
    name?: string;
    datasource?: string;
}

/**
 * @param path string space delimited path(s) to populate
 * @param select string optional fields to select
 */
export interface IPopulate {
    path: string;
    select: string;
}

/**
 * @param ref string The name of the related collection
 * @param type anh Should be an ObjectID...
 */
export interface IReference {
    ref: string;
    type?: any;
}



