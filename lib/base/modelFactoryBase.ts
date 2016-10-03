import { _ } from 'streamline-runtime';
import { IModelActions, IModelHelper } from 'spirit.io/lib/interfaces'


import express = require ('express');
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const idValidator = require('mongoose-id-validator');

let trace;// = console.log;

export class ModelFactoryBase {

    public targetClass: any;
    public collectionName: string;
    public $properties: string[];
    public $references: string[];
    public $statics: string[];
    public $methods: string[];
    public $fields: string[];
    public $plurals: string[];
    public schemaDef: Object;
    public actions: IModelActions;
    public helper: IModelHelper;
    public datasource: string;

    constructor(targetClass: any) {
        this.targetClass = targetClass;
        this.collectionName = targetClass._collectionName;
        this.schemaDef = {};
        this.$properties = [];
        this.$references = [];
        this.$plurals = [];
        this.$statics = [];
        this.$methods = [];
    }

}