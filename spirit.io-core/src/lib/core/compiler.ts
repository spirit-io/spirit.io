/* tslint:disable:no-console */
import { wait } from 'f-promise';
import * as ts from 'typescript';
import * as fs from 'fs-extra';
import * as path from 'path';

import { helper as objectHelper } from '../utils/object';
import { Registry } from './registry';
import { IModelFactory } from '../interfaces';
import { ConnectorHelper } from './connectorHelper';

import * as debug from 'debug';

const trace = debug('sio:compiler');

interface ILoadedElement {
    name: string;
    node: ts.ClassDeclaration;
    factory: IModelFactory;
}

function releaseBuildingFactory(collectionName: string, myClass: any): IModelFactory {
    // Manage fatories
    const f: IModelFactory = ConnectorHelper.createModelFactory(collectionName, myClass);
    trace(' => Release building model factory: ', f.collectionName);
    Registry.setFactory(f);

    // Register same factory with super class name if the class is expected to replace super class
    const linkedFactoryName: string = myClass.__factory__[collectionName]._linkToFactory;
    if (linkedFactoryName) {
        const linkedFactory: IModelFactory = ConnectorHelper.createModelFactory(collectionName, myClass, {
            linkedFactory: linkedFactoryName,
        });
        Registry.setFactory(linkedFactory, true);
    }

    // Free memory
    delete myClass.__factory__[collectionName];
    if (Object.keys(myClass.__factory__).length === 0) delete myClass.__factory__;

    return f;
}

function generateSchemaDefinitions(files: any, options: ts.CompilerOptions): void {
    // Build a program using the set of root file names in files
    // files is an object, with ts files names as keys
    const program = ts.createProgram(Object.keys(files), options);

    // Get the checker, we will use it to find more about classes
    const checker = program.getTypeChecker();

    const classes: Map<string, ts.ClassDeclaration> = new Map();
    const enums: Map<string, ts.EnumDeclaration> = new Map();
    const sourceFiles = program.getSourceFiles();
    // Visit every sourceFile in the program
    // first loop to load every model factories (necessary for cyclic relations)
    const modelElements: ILoadedElement[] = [];
    for (const sourceFile of sourceFiles) {
        // Walk the tree to search for classes
        ts.forEachChild(sourceFile, visit);
    }
    trace('Classes loaded: ', classes.keys());
    trace('Model factory loaded: ', Registry.factories.keys());
    // second loop to compile and build schemas
    modelElements.forEach((elt) => {
        trace('\n\n==========================\nInspect class: ', elt.name);
        inspectClass(elt.node, elt.factory);
    });

    // return modelElements.map(elt => { return elt.factory; });

    function visit(node: ts.Node) {
        // Only consider exported nodes
        if (!isNodeExported(node)) {
            return;
        }

        if (node.kind === ts.SyntaxKind.EnumDeclaration) {
            const symbol = checker.getSymbolAtLocation((node as ts.EnumDeclaration).name);
            if (symbol) {
                const eName = symbol.getName();
                enums.set(eName, (node as ts.EnumDeclaration));
                loadEnum((node as ts.EnumDeclaration));
            }
        } else if (node.kind === ts.SyntaxKind.ClassDeclaration) {
            // store classes files to manage inheritance
            const symbol = checker.getSymbolAtLocation((node as ts.ClassDeclaration).name as ts.Node);
            if (symbol) {
                const className = symbol.getName();
                classes.set(className, (node as ts.ClassDeclaration));

                // load class only if not already loaded
                // if (!modelElements.some((elt) => {return elt.name === (<ts.SourceFile>node.parent).fileName})) {
                const elt: ILoadedElement | undefined = loadModelFactories((node as ts.ClassDeclaration));
                if (elt) {
                    modelElements.push(elt);
                    trace(`Loaded: ${elt.factory.collectionName}`);
                }
                // }
                // No need to walk any further, class expressions/inner declarations
                // cannot be exported
            }
        } else if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
            // This is a namespace, visit its children
            ts.forEachChild(node, visit);
        }
    }

    function loadEnum(node: ts.EnumDeclaration) {
        const sf: ts.SourceFile = node.parent as ts.SourceFile;
        const symbol = checker.getSymbolAtLocation(node.name);
        // console.log(`Symbol: ${require('util').inspect(symbol, null, 1)}`);
        if (symbol) {
            const eName = symbol.getName();
            const fName = files[sf.fileName];
            const e = require(fName);
            const myEnum = e[eName];
            Registry.registerEnum(eName, myEnum);
        }
    }

    function loadModelFactories(node: ts.ClassDeclaration): ILoadedElement | undefined {
        const sf: ts.SourceFile = node.parent as ts.SourceFile;
        const symbol = checker.getSymbolAtLocation(node.name as ts.Node);
        // console.log(`Symbol: ${require('util').inspect(symbol,null,1)}`);
        if (symbol) {
            const className = symbol.getName();

            // consider only classes with @model(...) decorator
            if (!isModelClass(node)) return;
            const fName = files[sf.fileName];
            // console.log("fName:",fName)
            const r = require(fName);
            const myClass = r[className];
            if (!myClass) {
                console.log(`Class ${className} not found in module ${sf.fileName}. Please check it is correctly exported`);
                return;
            }

            myClass._collectionName = className;
            myClass._documentation = ts.displayPartsToString(symbol.getDocumentationComment(checker));
            // Load model factory
            return {
                name: className,
                node,
                factory: releaseBuildingFactory(className, myClass),
            };
        }
        return;
    }

    /** Inspect a class symbol infomration */
    function inspectClass(node: ts.ClassDeclaration, modelFactory: IModelFactory): any {

        //////////////////////////////////////////
        function inspectMembers(member: ts.NamedDeclaration | ts.VariableDeclaration) {
            // console.log("member: "+require('util').inspect(member,null,1));

            function log(prefix: String, obj: any) {
                const _symbol = checker.getSymbolAtLocation(member.name as ts.Node);
                trace(`Member of class: ${cn} - Name: ${_symbol && _symbol.getName()} - Kind: ${prefix},`, obj.kind);
            }

            function nyi() {
                const _symbol = checker.getSymbolAtLocation(member.name as ts.Node);
                console.log(`# Warning: Syntax kind '${ts.SyntaxKind[member.kind]}' not yet managed for member ` +
                    `'${_symbol && _symbol.getName()}' in class '${cn}'`);
            }

            //////////////////////////////////////////
            function transformPropertyType(name: string, prop: ts.Node, _type: any): any {
                // check if model factory is registered
                const factoryRef: IModelFactory = Registry.getFactory(_type);
                if (!factoryRef) throw new Error(`No model factory registerd for type '${_type}'`);
                return { type: String, ref: _type };
            }

            function isSpecialFunction(_decorator: string): boolean {
                if (!decorators) return false;
                for (const decorator of  decorators) {
                    const match = decorator.name && decorator.name.match(/\w+/g);
                    if (match && match[0] === _decorator) {
                        return true;
                    }
                }
                return false;
            }

            function isHookFunction(): boolean {
                return isSpecialFunction('hook');
            }

            function isRouteFunction(): boolean {
                return isSpecialFunction('route');
            }

            const currentSymbol = checker.getSymbolAtLocation(node.name as ts.Node);
            const cn = currentSymbol && currentSymbol.getName();
            let symbol: ts.Symbol | undefined;
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
                log('Variable', member);
                break;
            case ts.SyntaxKind.MethodDeclaration:
                log('Method', member);
                symbol = checker.getSymbolAtLocation(member.name as ts.Node);
                // do not consider hooks and private functions
                if (symbol && !isHookFunction() && !isRouteFunction() && !isPrivate(member)) {
                    if (isStatic(member)) {
                        modelFactory.$statics.push(symbol.name);
                    } else {
                        modelFactory.$methods.push(symbol.name);
                    }
                }
                break;
            case ts.SyntaxKind.FunctionDeclaration:
                log('Function', member);
                break;
            case ts.SyntaxKind.GetAccessor:
                nyi();
                break;
            case ts.SyntaxKind.SetAccessor:
                nyi();
                break;
            case ts.SyntaxKind.PropertyDeclaration:
                const prop: ts.PropertyDeclaration = member as ts.PropertyDeclaration;
                // ignore private properties
                if (isPrivate(prop)) return;
                // ignore properties assigned with an arrow function
                if (prop.initializer && prop.initializer.kind === ts.SyntaxKind.ArrowFunction) return;

                symbol = checker.getSymbolAtLocation(prop.name);
                if (symbol) {
                    const propertyName = symbol.getName();
                    // console.log("Property",prop);

                    // !!! IMPORTANT !!!
                    // retrieve the real type. this part explains essentially why using this schema compiler
                    // reflect-metadata could have been used in decorators, but cyclic dependencies would have been a limitation
                    type = checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration));
                    trace(`Member of class: ${cn} - Name: ${propertyName} - Kind: Property,${member.kind} - Type: ${type}`);

                    const _isArray = type.indexOf('[]') !== -1;
                    if (_isArray) {
                        type = type.substring(0, type.length - 2);
                    }
                    let _isReference = false;

                    const _isEnum = enums.has(type) ? type : undefined;
                    if (_isEnum) {
                        type = { type: 'Number' };
                    } else if (!isNativeType(type)) {
                        type = transformPropertyType(propertyName, prop, type);
                        _isReference = true;
                    } else {
                        type = { type: type.slice(0, 1).toUpperCase() + type.slice(1) };
                    }

                    const res = {
                        name: propertyName,
                        value: type,
                        _isArray,
                        _isReference,
                        _isReadonly: isReadonly(prop),
                        _isEnum,
                    };
                    // console.log("Member type:", res);
                    return res;
                }
            default:
                console.log(`# Warning: Syntax kind '${ts.SyntaxKind[member.kind]}' not yet managed`);
            }
            return;
        }

        function getClassExtendsHeritageClauseElement(declaration: ts.ClassDeclaration) {
            const heritageClause = getHeritageClause(declaration.heritageClauses, ts.SyntaxKind.ExtendsKeyword);
            return heritageClause && heritageClause.types.length > 0 ? heritageClause.types[0] : undefined;
        }

        function getHeritageClause(clauses, kind) {
            if (clauses) {
                for (let _i = 0, clauses_1 = clauses; _i < clauses_1.length; _i++) {
                    const clause = clauses_1[_i];
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
            superClassName = (superClassName.expression as ts.CallExpression).getText();
            trace('  --> inspect super class:', superClassName);
            if (classes.has(superClassName)) {
                let superModelFactory: IModelFactory;
                try {
                    superModelFactory = Registry.getFactory(superClassName);
                    objectHelper.merge(superModelFactory.$prototype, modelFactory.$prototype);
                } catch (e) {
                    trace('No model factory found for super class: ', superClassName);
                }
                const superClass: ts.ClassDeclaration | undefined = classes.get(superClassName);
                if (superClass) {
                    inspectClass(superClass, modelFactory);
                }
            }
        }

        if (node.members) {
            const members = node.members.map(inspectMembers);
            members && members.reduce((prev: any, curr: any) => {
                if (curr) {
                    // the field is maybe already existing in the schemaDef because the a decorator set it.
                    if (typeof prev[curr.name] === 'object' && prev[curr.name]) {
                        // if it is a string, only the type is already a part of the field value
                        if (typeof curr.value === 'string') {
                            objectHelper.merge({ type: curr.value }, prev[curr.name]);
                        } else {
                            objectHelper.merge(curr.value, prev[curr.name]);
                        }
                    } else {
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

                    if (curr._isEnum) {
                        prev[curr.name].isEnum = curr._isEnum;
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
            expression = decorator.expression as ts.Identifier;
            return {
                name: expression.getText(),
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
            const decorators = node.decorators.map(inspectDecorator);
            decorators && decorators.forEach((d) => {
                if (d.name.indexOf('model(') !== -1) _isModelClass = true;
            });
        }
        return _isModelClass;
    }

    /** True if this is visible outside this file, false otherwise */
    function isNodeExported(node: ts.Node): boolean {
        // tslint:disable-next-line:no-bitwise
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
        return node.modifiers && node.modifiers.some((m) => {
            return m.kind === kind;
        });
    }
}

export class Compiler {
    public static registerModels = (directories: any) => {

        function browseDir(dir) {
            // Add each .js file to the mocha instance
            wait(fs.readdir(dir)).forEach((file) => {
                const filePath = path.join(dir, file);
                const stats = wait(fs.stat(filePath));
                if (stats.isDirectory()) {
                    browseDir(filePath);
                } else if (stats.isFile() && /\.js.map$/.test(file)) {
                    // Only keep the .js.map files
                    // console.log("File:", file)
                    const srcMap = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
                    srcMap.sources.forEach((s) => {
                        const tsPath = path.normalize(path.join(dir, srcMap.sourceRoot, s)).replace(/\\/g, '/');
                        modelFiles[tsPath] = path.normalize(path.join(dir, srcMap.file)).replace(/\\/g, '/');
                    });
                }
            });
        }

        //
        //
        const directoriesArray = Array.isArray(directories) ? directories : [directories];
        const modelFiles = {};
        directoriesArray.forEach((dir) => {
            // console.log("Browse dir:", dir)
            browseDir(dir);
        });
        // console.log("Model files:", modelFiles)
        generateSchemaDefinitions(modelFiles, {
            target: ts.ScriptTarget.ES2017,
            module: ts.ModuleKind.CommonJS,
            preserveConstEnums: true,
        });

        for (const modelFactory of Registry.factories.values()) {
            trace('===============================');
            trace('Model factory:', modelFactory);
            // setup model actions
            modelFactory.setup();
        }
    }
}
