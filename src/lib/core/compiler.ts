import { wait } from 'f-promise';
import * as ts from "typescript";
import * as fs from "mz/fs";
import * as path from 'path';
import { helper as objectHelper } from '../utils/object';
import { Registry } from './registry';
import { IModelFactory } from '../interfaces';
import { ConnectorHelper } from '../core/connectorHelper';

import * as debug from 'debug';
let trace = debug('sio:compiler');

interface ILoadedElement {
    name: string;
    node: ts.ClassDeclaration,
    factory: IModelFactory
}

function releaseBuildingFactory(collectionName: string, myClass: any): IModelFactory {
    // Manage fatories
    let f: IModelFactory = ConnectorHelper.createModelFactory(collectionName, myClass);
    trace(" => Release building model factory: ", f.collectionName);
    Registry.setFactory(f);


    // Manage validators
    if (myClass.__factory__.validators) {

    }

    // Free memory
    myClass.__factory__[collectionName] = null;
    if (Object.keys(myClass.__factory__).length === 0) myClass.__factory__ = null;

    return f;
}

function generateSchemaDefinitions(files: any, options: ts.CompilerOptions): IModelFactory[] {
    // Build a program using the set of root file names in files
    // files is an object, with ts files names as keys
    let program = ts.createProgram(Object.keys(files), options);

    // Get the checker, we will use it to find more about classes
    let checker = program.getTypeChecker();

    let classes: Map<string, ts.ClassDeclaration> = new Map();
    let sourceFiles = program.getSourceFiles();
    // Visit every sourceFile in the program
    // first loop to load every model factories (necessary for cyclic relations)
    let modelElements: ILoadedElement[] = [];
    for (const sourceFile of sourceFiles) {
        // Walk the tree to search for classes
        ts.forEachChild(sourceFile, visit);
    }
    trace("Classes loaded: ", classes.keys());
    trace("Model factory loaded: ", Registry.factories.keys());
    // second loop to compile and build schemas
    modelElements.forEach(function (elt) {
        trace("\n\n==========================\nInspect class: ", elt.name);
        inspectClass(elt.node, elt.factory);
    });
    return modelElements.map(elt => { return elt.factory; });

    function visit(node: ts.Node) {
        // Only consider exported nodes
        if (!isNodeExported(node)) {
            return;
        }

        if (node.kind === ts.SyntaxKind.ClassDeclaration) {
            // store classes files to manage inheritance
            let className = checker.getSymbolAtLocation((<ts.ClassDeclaration>node).name).getName();
            classes.set(className, (<ts.ClassDeclaration>node));

            // load class only if not already loaded
            // if (!modelElements.some((elt) => {return elt.name === (<ts.SourceFile>node.parent).fileName})) {
            let elt: ILoadedElement = loadModelFactories((<ts.ClassDeclaration>node));
            if (elt) {
                modelElements.push(elt);
                trace(`Loaded: ${elt.factory.collectionName}`);
            }
            //}
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
        //console.log(`Symbol: ${require('util').inspect(symbol,null,1)}`);
        let className = symbol.getName();

        // consider only classes with @model(...) decorator
        if (!isModelClass(node)) return;
        let fName = files[sf.fileName];
        //console.log("fName:",fName)
        const r = require(fName);
        let myClass = r[className];
        if (!myClass) {
            console.log(`Class ${className} not found in module ${sf.fileName}. Please check it is correctly exported`);
            return;
        }

        myClass._collectionName = className;
        myClass._documentation = ts.displayPartsToString(symbol.getDocumentationComment());
        // Load model factory
        return {
            name: className,
            node: node,
            factory: releaseBuildingFactory(className, myClass)
        }
    }

    /** Inspect a class symbol infomration */
    function inspectClass(node: ts.ClassDeclaration, modelFactory: IModelFactory): any {

        //////////////////////////////////////////
        function inspectMembers(member: ts.Declaration | ts.VariableDeclaration) {
            // console.log("member: "+require('util').inspect(member,null,1));

            function log(prefix: String, obj: any) {
                trace("Member of class: " + cn + " - Name: " + checker.getSymbolAtLocation(member.name).getName() + " - Kind: " + prefix + ",", obj.kind)
            }

            function nyi() {
                console.log(`# Warning: Syntax kind '${ts.SyntaxKind[member.kind]}' not yet managed for member '${checker.getSymbolAtLocation(member.name).getName()}' in class '${cn}'`);
            }

            //////////////////////////////////////////
            function transformPropertyType(name: string, node: ts.Node, type: any): any {
                // check if model factory is registered
                let factoryRef: IModelFactory = Registry.getFactory(type);
                if (!factoryRef) throw new Error(`No model factory registerd for type '${type}'`);
                return { type: String, ref: type };
            }


            function isSpecialFunction(_decorator: string): boolean {
                if (!decorators) return false;
                for (var i = 0; i < decorators.length; i++) {
                    let match = decorators[i].name && decorators[i].name.match(/\w+/g);
                    if (match && match[0] === _decorator) {
                        return true;
                    }
                };
                return false;
            }

            function isHookFunction(): boolean {
                return isSpecialFunction('hook');
            }

            function isRouteFunction(): boolean {
                return isSpecialFunction('route');
            }

            let cn = checker.getSymbolAtLocation(node.name).getName();
            let symbol: ts.Symbol;
            let type: any;
            let decorators: any[];
            if (member.decorators) {
                decorators = member.decorators.map(inspectDecorator);
            }

            switch (member && member.kind) {
                case ts.SyntaxKind.Constructor:
                    // Do nothing for constructors
                    break;
                case ts.SyntaxKind.VariableDeclaration:
                case ts.SyntaxKind.VariableDeclarationList:
                    log("Variable", member);
                    break;
                case ts.SyntaxKind.MethodDeclaration:
                    log("Method", member);
                    symbol = checker.getSymbolAtLocation(member.name);
                    // do not consider hooks and private functions
                    if (!isHookFunction() && !isRouteFunction() && !isPrivate(member)) {
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
                    nyi();
                    break;
                case ts.SyntaxKind.SetAccessor:
                    nyi();
                    break;
                case ts.SyntaxKind.PropertyDeclaration:
                    let prop: ts.PropertyDeclaration = <ts.PropertyDeclaration>member;
                    // ignore private properties
                    if (isPrivate(prop)) return;
                    // ignore properties assigned with an arrow function
                    if (prop.initializer && prop.initializer.kind === ts.SyntaxKind.ArrowFunction) return;

                    symbol = checker.getSymbolAtLocation(prop.name);
                    let propertyName = symbol.getName();
                    //console.log("Property",prop);

                    // !!! IMPORTANT !!!
                    // retrieve the real type. this part explains essentially why using this schema compiler
                    // reflect-metadata could have been used in decorators, but cyclic dependencies would have been a limitation
                    type = checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration));
                    trace("Member of class: " + cn + " - Name: " + propertyName + " - Kind: Property," + member.kind + " - Type: " + type);

                    let _isArray = type.indexOf('[]') !== -1;
                    if (_isArray) {
                        type = type.substring(0, type.length - 2);
                    }
                    let _isReference = false;
                    if (!isNativeType(type)) {
                        type = transformPropertyType(propertyName, prop, type);
                        _isReference = true;
                    } else {
                        type = { type: type.slice(0, 1).toUpperCase() + type.slice(1) };
                    }

                    let res = {
                        name: propertyName,
                        value: type,
                        _isArray: _isArray,
                        _isReference: _isReference,
                        _isReadonly: isReadonly(prop)
                    };
                    // console.log("Member type:", res);
                    return res;
                default:
                    console.log(`# Warning: Syntax kind '${ts.SyntaxKind[member.kind]}' not yet managed`);
            }

        }


        function getClassExtendsHeritageClauseElement(node) {
            var heritageClause = getHeritageClause(node.heritageClauses, ts.SyntaxKind.ExtendsKeyword /* ExtendsKeyword */);
            return heritageClause && heritageClause.types.length > 0 ? heritageClause.types[0] : undefined;
        }

        function getHeritageClause(clauses, kind) {
            if (clauses) {
                for (var _i = 0, clauses_1 = clauses; _i < clauses_1.length; _i++) {
                    var clause = clauses_1[_i];
                    if (clause.token === kind) {
                        return clause;
                    }
                }
            }
            return undefined;
        }

        //////////////////////////////////////////////////
        let superClassName = getClassExtendsHeritageClauseElement(node);
        if (superClassName) {
            superClassName = (<ts.CallExpression>superClassName.expression).getText();
            trace("  --> inspect super class:", superClassName);
            if (classes.has(superClassName)) {
                let superClass: ts.ClassDeclaration = classes.get(superClassName);
                let superModelFactory = Registry.getFactory(superClassName)
                if (superModelFactory) {
                    objectHelper.merge(superModelFactory.$prototype, modelFactory.$prototype);
                } else {
                    trace("No model factory found for super class: ", superClassName);
                }
                inspectClass(superClass, modelFactory);
            }
        }



        if (node.members) {
            let members = node.members.map(inspectMembers);
            members && members.reduce(function (prev: any, curr: any) {
                if (curr) {
                    // the field is maybe already existing in the schemaDef because the a decorator set it.
                    if (typeof prev[curr.name] === 'object' && prev[curr.name]) {
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
                    if (curr._isArray) {
                        prev[curr.name] = Array.isArray(prev[curr.name]) ? prev[curr.name] : [prev[curr.name]];
                        if (modelFactory.$plurals.indexOf(curr.name) === -1) modelFactory.$plurals.push(curr.name);
                    }
                    // store properties name that would be used for filtering returned properties
                    // some of them have already been set by decorators
                    if (!curr._isReference && modelFactory.$properties.indexOf(curr.name) === -1) {
                        modelFactory.$properties.push(curr.name);
                    } else if (curr._isReference && !modelFactory.$references[curr.name]) {
                        modelFactory.$references[curr.name] = {};
                    }

                    if (curr._isReadonly) {
                        prev[curr.name].readOnly = true;
                    }
                }
                return prev;
            }, modelFactory.$prototype);
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

            // case ts.SyntaxKind.CallExpression:
            //     // console.log("Call expression: "+require('util').inspect(decorator,null,1));
            //     expression = <ts.CallExpression>decorator.expression;
            //     if (!expression) return;
            //     let symbol = checker.getSymbolAtLocation(expression.getFirstToken());
            //     let args = <ts.NodeArray<ts.Node>>expression.arguments;
            //     let decoratorType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
            //     let callSig = decoratorType.getCallSignatures()[0];
            //     var params: ts.Symbol[] = callSig.getParameters();
            //     return {
            //         name: symbol.getName(),
            //         args: args.reduce(function (prev: any, curr: ts.Node, idx: number) {
            //             var paramName = params[idx].getName();
            //             prev[paramName] = curr.getText().replace(/\"/g, '');
            //             return prev;
            //         }, {})
            //     }
            default:
                console.log(`Decorator ${decorator.kind} management not yet implemented`);
        }

    }

    function isNativeType(type: string): boolean {
        return ['string', 'number', 'date', 'boolean', 'array', 'object'].indexOf(type.toLowerCase()) !== -1;
    }

    function isModelClass(node: ts.Node): boolean {
        let _isModelClass = false;
        // get decorators
        if (node.decorators) {
            let decorators = node.decorators.map(inspectDecorator);
            decorators && decorators.forEach(function (d) {
                if (d.name.indexOf("model(") !== -1) _isModelClass = true;
            });
        }
        return _isModelClass;
    }

    /** True if this is visible outside this file, false otherwise */
    function isNodeExported(node: ts.Node): boolean {
        return (node.flags & ts.ModifierFlags.Export) !== 0 || (node.parent && node.parent.kind === ts.SyntaxKind.SourceFile);
    }

    function isStatic(node: ts.Node) {
        return hasModifier(node, ts.SyntaxKind.StaticKeyword);
    }

    function isPrivate(node: ts.Node) {
        return hasModifier(node, ts.SyntaxKind.PrivateKeyword);
    }

    function isReadonly(node: ts.Node) {
        return hasModifier(node, ts.SyntaxKind.ReadonlyKeyword);
    }

    function hasModifier(node: ts.Node, kind: ts.SyntaxKind) {
        return node.modifiers && node.modifiers.some(function (m) {
            return m.kind === kind;
        });
    }
}

export class Compiler {
    static registerModels = (directories: any) => {

        function browseDir(dir) {
            // Add each .js file to the mocha instance
            wait(fs.readdir(dir)).forEach(function (file) {
                let filePath = path.join(dir, file);
                var stats = wait(fs.stat(filePath));
                if (stats.isDirectory()) {
                    browseDir(filePath);
                } else if (stats.isFile() && /\.js.map$/.test(file)) {
                    // Only keep the .js.map files
                    //console.log("File:", file)
                    let srcMap = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
                    srcMap.sources.forEach((s) => {
                        let tsPath = path.normalize(path.join(dir, srcMap.sourceRoot, s)).replace(/\\/g, '/');
                        let jsPath = path.normalize(path.join(dir, srcMap.file)).replace(/\\/g, '/');
                        modelFiles[tsPath] = jsPath;
                    });
                }
            });
        }
        //
        //
        directories = Array.isArray(directories) ? directories : [directories];
        let modelFiles = {};
        directories.forEach(function (dir) {
            //console.log("Browse dir:", dir)
            browseDir(dir);
        });
        //console.log("Model files:", modelFiles)
        generateSchemaDefinitions(modelFiles, {
            target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
        }).forEach(function (modelFactory: IModelFactory) {
            trace("===============================");
            trace("Model factory:", modelFactory);
            // setup model actions
            modelFactory.setup();
        });
    }
}