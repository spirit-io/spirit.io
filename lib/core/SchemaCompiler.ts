import * as ts from "typescript";
import * as fs from "fs";
import * as path from 'path';
import * as qs from "querystring";
import { helper as objectHelper } from '../utils/object';
import { Contract } from "../application/contract";
import { Middleware, ModelRegistry } from './';
import { IModelFactory } from '../interfaces';

import express = require('express');

let trace;// = console.log;

interface ILoadedElement{
    node: ts.ClassDeclaration,
    factory: IModelFactory
}

function generateSchemaDefinitions(fileNames: string[], options: ts.CompilerOptions): IModelFactory[] {
    // Build a program using the set of root file names in fileNames
    let program = ts.createProgram(fileNames, options);

    // Get the checker, we will use it to find more about classes
    let checker = program.getTypeChecker();

    let sourceFiles = program.getSourceFiles();
    // Visit every sourceFile in the program
    // first loop to load every model factories (necessary for cyclic relations)
    let modelElements: ILoadedElement[] = [];
    for (const sourceFile of sourceFiles) {
        // Walk the tree to search for classes
        ts.forEachChild(sourceFile, visit);
    }
    // second loop to compile and build schemas
    modelElements.forEach(function(elt) {
        inspectClass(elt.node, elt.factory);
    });
    return modelElements.map(elt => { return elt.factory; });

    function visit(node: ts.Node) {
        // Only consider exported nodes
        if (!isNodeExported(node)) {
            return;
        }

        if (node.kind === ts.SyntaxKind.ClassDeclaration) {
            let elt: ILoadedElement = loadModelFactories((<ts.ClassDeclaration>node));
            if (elt) modelElements.push(elt);
            // No need to walk any further, class expressions/inner declarations
            // cannot be exported
        }
        else if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
            // This is a namespace, visit its children
            ts.forEachChild(node, visit);
        }
    }

    function loadModelFactories(node: ts.ClassDeclaration): ILoadedElement {
        let sf: ts.SourceFile = <ts.SourceFile>node.parent;
        let symbol = checker.getSymbolAtLocation(node.name);
        let className = symbol.getName();

        // consider only classes with @collection(...) decorator
        if(!isModelClass(node)) return;

        const r = require(sf.fileName);
        let myClass = r[className];
        if (!myClass) {
            console.log(`Class ${className} not found in module ${sf.fileName}. Please check it is correctly exported`);
            return;
        }

        myClass._documentation = ts.displayPartsToString(symbol.getDocumentationComment());

        // Load model factory
        return {
            node: node,
            factory: ModelRegistry.get(myClass)
        }
    }

    /** Inspect a class symbol infomration */
    function inspectClass(node: ts.ClassDeclaration, modelFactory: IModelFactory): any {

        //////////////////////////////////////////
        function inspectMembers(member: ts.Declaration | ts.VariableDeclaration) {
            // console.log("member: "+require('util').inspect(member,null,1));

            function log(prefix: String, obj: any) {
                //console.log(`${prefix}: ${require('util').inspect(obj, null, 1)}`);
            }

            //////////////////////////////////////////
            function transformPropertyType(name: string, node: ts.Node, type: any): any {
                // check if model factory is registered
                let factoryRef: IModelFactory = ModelRegistry.get(type.toLowerCase());
                if (!factoryRef) throw new Error(`No model factory registerd for type '${type}'`);
                return { type: String, ref: type.toLowerCase() };
            }

            let symbol: ts.Symbol;
            let type: string;

            switch (member && member.kind) {
                case ts.SyntaxKind.VariableDeclaration:
                case ts.SyntaxKind.VariableDeclarationList:
                    log("Variable", member);
                    break;
                case ts.SyntaxKind.MethodDeclaration:
                    log("Member",member);
                    symbol = checker.getSymbolAtLocation(member.name);
                    if (!isPrivate(member)) {
                        if (isStatic(member)) {
                            modelFactory.$statics.push(symbol.name);
                        } else {
                            modelFactory.$methods.push(symbol.name);
                        }
                    }
                    break;
                case ts.SyntaxKind.FunctionDeclaration:
                    log("Function", member);
                    break;
                case ts.SyntaxKind.GetAccessor:
                    // log("Getter",member);
                    break;
                case ts.SyntaxKind.SetAccessor:
                    log("Setter", member);
                    break;
                case ts.SyntaxKind.PropertyDeclaration:
                    symbol = checker.getSymbolAtLocation(member.name);
                    let propertyName = symbol.getName();
                    //console.log("Property",member);

                    // !!! IMPORTANT !!!
                    // retrieve the real type. this part explains essentially why using this schema compiler
                    // reflect-metadata could have been used in decorators, but cyclic dependencies would have been a limitation
                    type = checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration));
                    let _isArray = type.indexOf('[]') !== -1;
                    if (_isArray) {
                        type = type.substring(0, type.length - 2);
                    }
                    let _isReference = false;
                    if (!isNativeType(type)) {
                        type = transformPropertyType(propertyName, member, type);
                        _isReference = true;
                    }

                    return {
                        name: propertyName,
                        value: type,
                        _isArray: _isArray,
                        _isReference: _isReference
                    };
                default:
                    console.log(`# Warning: Syntax kind '${ts.SyntaxKind[member.kind]}' not yet managed`);
            }

        }




        //////////////////////////////////////////////////
        let symbol = checker.getSymbolAtLocation(node.name);
        if (node.members) {
            let members = node.members.map(inspectMembers);
            members && members.reduce(function (prev: any, curr: any) {
                if (curr) {
                    // the field is maybe already existing in the schemaDef because the a decorator set it.
                    if (prev[curr.name]) {
                        // if it is a string, only the type is already a part of the field value
                        if (typeof curr.value === 'string') {
                            objectHelper.merge({ type: curr.value }, prev[curr.name]);
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
                    // manage plural
                    if (curr._isArray) prev[curr.name] = [prev[curr.name]];
                    // store properties name that would be used for filtering returned properties
                    // some of them have already been set by decorators
                    if (!curr._isReference && modelFactory.$properties.indexOf(curr.name) == -1) {
                        modelFactory.$properties.push(curr.name);
                    } else if (curr._isReference && modelFactory.$references.indexOf(curr.name) == -1) {
                        modelFactory.$references.push(curr.name);
                    }
                }
                return prev;
            }, modelFactory.schemaDef);
        }
        return modelFactory;
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
                    args: args.reduce(function (prev: any, curr: ts.Node, idx: number) {
                        var paramName = params[idx].getName();
                        prev[paramName] = curr.getText().replace(/\"/g, '');
                        return prev;
                    }, {})
                }
            default:
                console.log(`Decorator ${decorator.kind} management not yet implemented`);
        }

    }

    function isNativeType(type: string): boolean {
        return ['string', 'number', 'date', 'buffer', 'boolean', 'mixed', 'objectid', 'array'].indexOf(type.toLowerCase()) !== -1;
    }

    function isModelClass(node: ts.Node): boolean {
        let _isModelClass = false;
        // get decorators
        if (node.decorators) {
            let decorators = node.decorators.map(inspectDecorator);
            decorators && decorators.forEach(function (d) {
                if (d.name.indexOf("collection(") !== -1) _isModelClass = true;
            });
        }
        return _isModelClass;
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
        return node.modifiers && node.modifiers.some(function (m) {
            return m.kind === kind;
        });
    }
}

export class SchemaCompiler {
    static registerModels = (routers: Map<string, express.Router>, contract: Contract) => {
        let modelFiles = Object.keys(Contract.MODELS).map(function (m) {
            return path.resolve(path.join(__dirname, `../models/${m.toLowerCase()}.ts`));
        });

        generateSchemaDefinitions(modelFiles, {
            target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
        }).forEach(function (modelFactory: IModelFactory) {
            //console.log("Model factory:", modelFactory);
            // setup model actions
            modelFactory.setup(routers);
        });
    }
}