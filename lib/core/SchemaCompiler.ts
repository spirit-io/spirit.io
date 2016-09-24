import * as ts from "typescript";
import * as fs from "fs";
import * as path from 'path';
import * as qs from "querystring";
import { helper as objectHelper } from '../utils/object';
import { Contract } from "../application/contract";
import { Middleware, ModelRegistry } from './';
import { IModelFactory } from '../interfaces';

import express = require ('express');

let trace;// = console.log;

function generateSchemaDefinitions(fileNames: string[], options: ts.CompilerOptions): any[] {
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

        //////////////////////////////////////////
        function inspectMembers(member: ts.Declaration | ts.VariableDeclaration) {
        // console.log("member: "+require('util').inspect(member,null,1));

            function log(prefix: String, obj: any) {
            console.log(`${prefix}: ${require('util').inspect(obj,null,1)}`);
            }

            let symbol: ts.Symbol;
            let type: string;
            
            switch(member && member.kind) {
                case ts.SyntaxKind.VariableDeclaration:
                case ts.SyntaxKind.VariableDeclarationList:
                    log("Variable",member);
                    break;
                case ts.SyntaxKind.MethodDeclaration:
                   // log("Member",member);
                    symbol = checker.getSymbolAtLocation(member.name);
                   // log("Symbol",symbol);

                    if (isStatic(member)) {
                        modelFactory.statics.push(symbol.name);
                    }

                   
                    

                    break;
                case ts.SyntaxKind.FunctionDeclaration:
                    log("Function",member);
                    break;
                case ts.SyntaxKind.GetAccessor:
                // log("Getter",member);
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



        //////////////////////////////////////////
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

        //////////////////////////////////////////
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





        //////////////////////////////////////////////////
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

        myClass._documentation = ts.displayPartsToString(symbol.getDocumentationComment());

        // Get model factory
        let modelFactory: IModelFactory = ModelRegistry.get(myClass);

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
                    if (modelFactory.properties.indexOf(curr.name) ==-1 ) {
                        modelFactory.properties.push(curr.name);
                    }
                }
                return prev;
            }, modelFactory.schemaDef);
        }
        return modelFactory;
    }



    function isAllowedType(type: string): boolean {
        return ['string', 'number', 'date', 'buffer', 'boolean', 'mixed', 'objectid', 'array'].indexOf(type.toLowerCase()) !== -1;
    }






    /** True if this is visible outside this file, false otherwise */
    function isNodeExported(node: ts.Node): boolean {
        return (node.flags & ts.NodeFlags.Export) !== 0 || (node.parent && node.parent.kind === ts.SyntaxKind.SourceFile);
    }

    function isStatic(node: ts.Node) {
        return hasModifier(node, ts.SyntaxKind.StaticKeyword);
    }

    function isPrivate(node: ts.Node) {
        return hasModifier(node, ts.SyntaxKind.PrivateKeyword);
    }

    function hasModifier(node: ts.Node, kind: ts.SyntaxKind) {
        return node.modifiers && node.modifiers.some(function(m) {
            return m.kind === kind;
        });
    }
}

export class SchemaCompiler {
    static registerModels = (app: express.Application, contract: Contract) => {
        let modelFiles = Object.keys(Contract.MODELS).map(function(m) {
            return path.resolve(path.join(__dirname, `../models/${m.toLowerCase()}.ts`));
        });

        generateSchemaDefinitions(modelFiles, {
            target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
        }).forEach(function(modelFactory: IModelFactory) {

            // setup model actions
            let modelRouter = modelFactory.setup(app);
        });
    }
}

       
