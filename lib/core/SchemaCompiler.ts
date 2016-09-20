import * as ts from "typescript";
import * as fs from "fs";
import * as path from 'path';
import * as qs from "querystring";
import { helper as objectHelper } from '../utils/object';
import { Schema } from 'mongoose';
import { Contract } from "../application/contract";
import { Router } from '../middlewares/router';

const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

let trace;// = console.log;

function generateSchemaDefinitions(router: Router, fileNames: string[], options: ts.CompilerOptions): any[] {
// Build a program using the set of root file names in fileNames
    let __currentClassName;
    let program = ts.createProgram(fileNames, options);

    // Get the checker, we will use it to find more about classes
    let checker = program.getTypeChecker();

    let classes: any[] = [];

    // Visit every sourceFile in the program
    for (const sourceFile of program.getSourceFiles()) {
        // Walk the tree to search for classes
        ts.forEachChild(sourceFile, visit);
    }
    return classes;

    function visit(node: ts.Node) {
        // Only consider exported nodes
        if (!isNodeExported(node)) {
            return;
        }

        if (node.kind === ts.SyntaxKind.ClassDeclaration) {
            // This is a top level class, get its symbol
            let modelClass = inspectClass((<ts.ClassDeclaration>node));
            if (modelClass) classes.push(modelClass);
            // No need to walk any further, class expressions/inner declarations
            // cannot be exported
        }
        else if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
            // This is a namespace, visit its children
            ts.forEachChild(node, visit);
        }
    }

    /** Inspect a class symbol infomration */
    function inspectClass(node: ts.ClassDeclaration): any {
        let sf: ts.SourceFile = <ts.SourceFile>node.parent;
        let symbol = checker.getSymbolAtLocation(node.name);
        let className = __currentClassName = symbol.getName();

        let _isModelClass = false;
        // get decorators
        if (node.decorators) {
            let decorators = node.decorators.map(inspectDecorator);
            decorators && decorators.forEach(function(d) {
                if (d.name.indexOf("collection(") !== -1) _isModelClass = true;
            });
        } 
        
        // consider only classes with @collection(...) decorator
        if (!_isModelClass) return;

        const r = require(sf.fileName);
        let myClass = r[className];
        if (!myClass) {
            console.log(`Class ${className} not found in module ${sf.fileName}. Please check it is correctly exported`);
            return;
        }

        // Normally, the collection name is already set in the collection decorator
        myClass._collectionName = myClass._collectionName.toLowerCase() || className.toLowerCase();
        myClass._documentation = ts.displayPartsToString(symbol.getDocumentationComment());


        //console.log("Shema declared when executing compiler:" , myClass._schemaDef);

        if (node.members) {
            let members = node.members.map(inspectMembers);
            members && members.reduce(function(prev: any, curr: any) {
                if (curr) {
                    // the field is maybe already existing in the schemaDef because the a decorator set it.
                    if (prev[curr.name]) {
                        // if it is a string, only the type is already a part of the field value
                        if (typeof curr.value === 'string') {
                            objectHelper.merge({type: curr.value}, prev[curr.name]);
                        }
                        // else we need to merge
                        else {
                            objectHelper.merge(curr.value, prev[curr.name]);
                        }
                    } 
                    // but some properties can have no decorator at all
                    else {
                        prev[curr.name] = curr.value;
                    }
                    // store properties name that would be used for filtering returned properties
                    // some of them have already been set by decorators
                    myClass._properties = myClass._properties || [];
                    if (myClass._properties.indexOf(curr.name) ==-1 ) {
                        myClass._properties.push(curr.name);
                    }
                }
                return prev;
            }, myClass._schemaDef);
        }
        return myClass;
    }

    function inspectMembers(member: ts.Declaration | ts.VariableDeclaration) {
       // console.log("member: "+require('util').inspect(member,null,1));

        function log(prefix: String, obj: any) {
           //console.log(`${prefix}: ${require('util').inspect(obj,null,1)}`);
        }

        let symbol: ts.Symbol;
        let type: string;
        
        switch(member && member.kind) {
            case ts.SyntaxKind.VariableDeclaration:
            case ts.SyntaxKind.VariableDeclarationList:
                log("Variable",member);
                break;
            case ts.SyntaxKind.MethodDeclaration:
                log("Method",member);
                break;
            case ts.SyntaxKind.FunctionDeclaration:
                log("Function",member);
                break;
            case ts.SyntaxKind.GetAccessor:
                log("Getter",member);
                break;
            case ts.SyntaxKind.SetAccessor:
                log("Setter",member);
                break;
            case ts.SyntaxKind.PropertyDeclaration:
                symbol = checker.getSymbolAtLocation(member.name);
                let propertyName = symbol.getName();
                //console.log("Property",member);

                // !!! IMPORTANT !!!
                // retrieve the real type. this part explains essentially why using this schema compiler
                // reflect-metadata could have been used in decorators, but cyclic dependencies would have been a limitation
                type = checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration));
                validatePropertyType(propertyName, member, type);


                return {
                    name: propertyName,
                    value: type
                };
            default: 
                console.log(`# Warning: Syntax kind '${ts.SyntaxKind[member.kind]}' not yet managed`);
        }
        
    }

    function isAllowedType(type: string): boolean {
        return ['string', 'number', 'date', 'buffer', 'boolean', 'mixed', 'objectid', 'array'].indexOf(type.toLowerCase()) !== -1;
    }

    function validatePropertyType(name: string, node: ts.Node, type: any) {
        if (isAllowedType(type)) return true;
        if (node.decorators) {
            let _isReference = false;
            let decorators = node.decorators.map(inspectDecorator);
            decorators && decorators.forEach(function(d) {
                if (d.name.indexOf('ref(') !== -1) {
                    _isReference = true;
                }
            });
            if (!_isReference) throw new Error(`Invalid type has been declared on property '${name}' in class '${__currentClassName}'. '@ref' decorator is probably missing.`);
        }
        return true;
    }


    function inspectDecorator(decorator: ts.Decorator): any {

        let expression: any;

        switch (decorator.kind) {
            case ts.SyntaxKind.Decorator:
               // console.log("Decorator: "+require('util').inspect(decorator,null,1));
                expression = <ts.Identifier>decorator.expression;
                return {
                    name: expression.getText()
                };

            case ts.SyntaxKind.CallExpression:
               // console.log("Call expression: "+require('util').inspect(decorator,null,1));
                expression = <ts.CallExpression>decorator.expression;
                if (!expression) return;
                let symbol = checker.getSymbolAtLocation(expression.getFirstToken());
                let args = <ts.NodeArray<ts.Node>>expression.arguments;
                let decoratorType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
                let callSig = decoratorType.getCallSignatures()[0];
                var params: ts.Symbol[] = callSig.getParameters();
                return {
                    name: symbol.getName(),
                    args: args.reduce(function(prev: any, curr: ts.Node, idx: number) {
                        var paramName = params[idx].getName();
                        prev[paramName] = curr.getText().replace(/\"/g, '');
                        return prev;
                    }, {})
                }
            default:
                console.log(`Decorator ${decorator.kind} management not yet implemented`);
        }

    }

    /** True if this is visible outside this file, false otherwise */
    function isNodeExported(node: ts.Node): boolean {
        return (node.flags & ts.NodeFlags.Export) !== 0 || (node.parent && node.parent.kind === ts.SyntaxKind.SourceFile);
    }
}

export function registerModels(router: Router){
    let modelFiles = Object.keys(Contract.MODELS).map(function(m) {
        return path.resolve(path.join(__dirname, `../models/${m.toLowerCase()}.ts`));
    });

    generateSchemaDefinitions(router, modelFiles, {
        target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
    }).forEach(function(aClass) {


        trace && trace(`Schema registered for collection ${aClass._collectionName}: ${JSON.stringify(aClass._schemaDef,null,2)}`)

        if (Object.keys(aClass._schemaDef).length) {
            let schema = new Schema(aClass._schemaDef, {_id: false, versionKey: false});
            schema.plugin(uniqueValidator);
            aClass._model = mongoose.model(aClass._collectionName, schema, aClass._collectionName);
        }


        router.setupModel(aClass);
    });
}
       
