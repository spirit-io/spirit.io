import "reflect-metadata";
import { _ } from 'streamline-runtime';
import { Schema, Model } from 'mongoose';
const uniqueValidator = require('mongoose-unique-validator');

const mongoose = require('mongoose');


export function log() {
  return function (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
    let originalMethod = descriptor.value; // save a reference to the original method
    console.log("Required is called:", target, propertyKey, descriptor);
    // NOTE: Do not use arrow syntax here. Use a function expression in 
    // order to use the correct value of `this` in this method (see notes below)
    descriptor.value = function (...args: any[]) {
      console.log("The method args are: " + JSON.stringify(args)); // pre
      let result = originalMethod.apply(this, args);               // run and store the result
      console.log("The return value is: " + result);               // post
      return result;                                               // return the result of the original method
    };

    return descriptor;
  }
}






export function collection(name?:string):any {
    return function(target:any, propertyKey:string, descriptor:TypedPropertyDescriptor<any>) {
        
        function reduceProperties(obj: any) {
            let keep: any = {};
            Object.keys(obj).forEach(function(key) {
                keep[key] = obj[key];
            });
            return keep;
        }
        
        
        
        // _model is computed by SchemaCompiler
        target.find = function(_:_, filter: any){
            return this._model.find(filter, this._properties.join(' '), _);
        }

        target.findById = function(_:_, id: any){
            return this._model.findById(id, _);
        }
    };
}

export function unique(target: Object, propertyKey: string | symbol) {
    console.log("Unique called on: ", target, propertyKey);
}

export function required(target: Object, propertyKey: string | symbol) {
    console.log("Required called on: ", target, propertyKey);
}

export function property() {
  return function(target: any, key: string) {
    var t = Reflect.getMetadata("design:type", target, key);
   // console.log(`${key} type: ${t && t.name}`);
  }
}