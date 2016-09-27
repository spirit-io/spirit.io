import { Schema } from 'mongoose';
import { IReference } from '../interfaces';
import { helper as objectHelper } from '../utils/object';
const helpers = require('./helpers');

// !!!!!!!!!!!!!!!
// properties metadata have to be stored on class constructor
// !!!!!!!!!!!!!!!


export function unique(target: any, propertyKey: string | symbol) {
    helpers.addMetadata(target.constructor, propertyKey, {unique: true});
}

export function required(target: any, propertyKey: string) {
    helpers.addMetadata(target.constructor, propertyKey, {required: true});
}

export function index(target: any, propertyKey: string) {
    helpers.addMetadata(target.constructor, propertyKey, {index: true});
}