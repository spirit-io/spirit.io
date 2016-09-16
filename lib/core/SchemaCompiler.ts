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

function generateMongooseSchema(router: Router, fileNames: string[], options: ts.CompilerOptions): any[] {
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
        // Do not consider ModelBase class
        if (sf.fileName.indexOf('modelBase.ts') !== -1) return;
        
        let symbol = checker.getSymbolAtLocation(node.name);
        let className = __currentClassName = symbol.getName();

        // console.log("class: "+require('util').inspect(node,null,1));
        const r = require(sf.fileName);
        let myClass = r[className];
        if (!myClass) {
            console.log(`Class ${className} not found in module ${sf.fileName}. Please check it correctly exported`);
            return;
        }
        myClass._collectionName = className.toLowerCase();
        myClass._documentation = ts.displayPartsToString(symbol.getDocumentationComment());

        // get decorators
        if (node.decorators) {
            let decorators = node.decorators.map(inspectDecorator);
            decorators && decorators.forEach(function(d) {
                switch(d.name) {
                    case "collection":
                        console.log("Handle collection decorator in schema compiler");
                        myClass._collectionName = (d.args && d.args.name).toLowerCase() || className.toLowerCase();
                        break;
                    default:
                        break;
                }
            });
        } else {
            //
            trace && trace(`Class ${className} ignored because it doesn't contains 'collection' decorator`);
            return;
        }

        //console.log("Shema declared when executing compiler:" , myClass._schemaDef);

        if (node.members) {
            myClass._properties = ['_id', '_createdAt', '_updatedAt'];
            let members = node.members.map(inspectMembers);
            members && members.reduce(function(prev: any, curr: any) {
                if (curr) {
                    if (prev[curr.name]) {
                        if (typeof curr.value === 'string') {
                            objectHelper.merge({type: curr.value}, prev[curr.name]);
                        } else {
                            objectHelper.merge(curr.value, prev[curr.name]);
                        }
                    } else {
                        prev[curr.name] = curr.value;
                    }
                    // store properties name that would be used for filtering returned properties
                    myClass._properties = myClass._properties || [];
                    myClass._properties.push(curr.name);
                }
                return prev;
            }, myClass._schemaDef);

            trace && trace(`Schema registered for collection ${myClass._collectionName}: ${JSON.stringify(myClass._schemaDef,null,2)}`)

            if (Object.keys(myClass._schemaDef).length) {
                let schema = new Schema(myClass._schemaDef, {_id: false, versionKey: false});
                schema.plugin(uniqueValidator);
                myClass._model = mongoose.model(myClass._collectionName, schema, myClass._collectionName);
            }

        }
        return myClass;
    }

    function inspectMembers(member: ts.Declaration | ts.VariableDeclaration) {
       // console.log("member: "+require('util').inspect(member,null,1));

        function log(prefix: String, obj: any) {
          // console.log(`${prefix}: ${require('util').inspect(obj,null,1)}`);
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
                log("Property",member);
                type = checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration));
                log("type", type);
                //if (!isAllowedType(type)) throw new Error(`Invalid type has been declared on property '${symbol.getName()}' in class '${__currentClassName}'. You should probably use '@ref' decorator`);
                let metadata = computePropertyMetadata(symbol.getName(), member);
                if (metadata) metadata.type = type;

                return {
                    name: symbol.getName(),
                    value: metadata || type
                };
            default: 
                console.log(`# Warning: Syntax kind '${ts.SyntaxKind[member.kind]}' not yet managed`);
        }
        
    }

    function isAllowedType(type: string): boolean {
        return ['string', 'number', 'date', 'buffer', 'boolean', 'mixed', 'objectid', 'array'].indexOf(type.toLowerCase()) !== -1;
    }

    function computePropertyMetadata(name: string, node: ts.Node) {
        if (node.decorators) {
            let decorators = node.decorators.map(inspectDecorator);
            let metadata: any = {};
            decorators && decorators.forEach(function(d) {
                switch(d.name) {

                    default:
                        break;
                }
            });

            return Object.keys(metadata).length > 0 ? metadata : null;
        }
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

    generateMongooseSchema(router, modelFiles, {
        target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
    }).forEach(function(c) {
        router.setupModel(c);
    });
}
       
