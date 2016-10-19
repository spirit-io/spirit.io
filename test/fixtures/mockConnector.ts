import { IConnector, IModelFactory } from '../../lib/interfaces'
import { ModelFactoryBase } from '../../lib/base'
import { Connection } from 'mongoose';
import express = require ('express');


class MockFactory extends ModelFactoryBase implements IModelFactory{
    public schema: any;
    public model: any;

    constructor(targetClass: any) {
        super(targetClass);
    }

    setup = (routers: Map<string, express.Router>) => {

    }
}

export class MockConnector implements IConnector {
    private _datasource: string = 'mongodb';
    private _config: any;

    get datasource(): string {
        return this._datasource;
    }

    set config(config: any) {
        this._config = config || {};
    }
    get config() {
        return this._config;
    }

    connect = (datasourceKey: string, parameters: any): any => {}

    createModelFactory = (myClass: any): IModelFactory => {
        return new MockFactory(myClass);
    }
}