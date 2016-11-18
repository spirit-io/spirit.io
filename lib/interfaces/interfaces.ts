import { _ } from 'streamline-runtime';
//import express = require("express");
import * as express from "express";

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
    $fields: string[];
    $plurals: string[];
    $statics: string[];
    $methods: string[];
    $references: any;
    $prototype: any;
    actions: IModelActions;
    helper: IModelHelper;
    controller: IModelController;
    setup(routers: Map<string, express.Router>);
    getModelFactoryByPath(path: string): IModelFactory;
    getReferenceType(refName: string): string;
    instanciateReference(type: string, data: any): any;
}

export interface IModelActions {
    query(_: _, filter?: any, parameters?: IQueryParameters): any;
    read(_: _, _id: string, parameters?: IFetchParameters): any;
    create(_: _, item: any): any;
    update(_: _, _id: string, item: any, options?: any): any;
    createOrUpdate(_: _, _id: any, item: any, options?: any): any;
    delete(_: _, _id: any): any;
}

export interface IModelHelper {
    fetchInstances(_, filter?: any, parameters?: IQueryParameters, serializeOptions?: ISerializeOptions): any[];
    fetchInstance(_, _id: string, parameters?: IFetchParameters, serializeOptions?: ISerializeOptions): any;
    saveInstance(_, instance: any, data?: any, options?: ISaveParameters, serializeOptions?: ISerializeOptions): any;
    deleteInstance(_: _, instance: any): any;
    serialize(instance: any, parameters?: IFetchParameters | IQueryParameters, options?: ISerializeOptions): any;
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

export interface IFetchParameters {
    includes?: any;
    ref?: string;
}

export interface ISaveParameters {
    ref?: string,
    deleteMissing?: boolean
}

export interface ISerializeOptions {
    modelFactory?: IModelFactory;
    ignoreNull?: boolean;
    serializeRef?: boolean;
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

export interface IModelOptions {

}



