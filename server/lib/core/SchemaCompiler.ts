import * as ts from "typescript";
import * as fs from "fs";
import * as qs from "querystring";
import { Schema }from 'mongoose';

interface IModel {
    name: String,
    documentation?: String,
    collectionName: String,
    schema: Schema
}


export function generateMongooseSchema(fileNames: string[], options: ts.CompilerOptions): IModel[] {
// Build a program using the set of root file names in fileNames
    let program = ts.createProgram(fileNames, options);

    // Get the checker, we will use it to find more about classes
    let checker = program.getTypeChecker();

    let output: IModel[] = [];

    // Visit every sourceFile in the program
    for (const sourceFile of program.getSourceFiles()) {
        // Walk the tree to search for classes
        ts.forEachChild(sourceFile, visit);
    }

    // print out the definition
    // fs.writeFileSync("classes.json", JSON.stringify(output, undefined, 4));

    return output;

    function visit(node: ts.Node) {
        // Only consider exported nodes
        if (!isNodeExported(node)) {
            return;
        }

        if (node.kind === ts.SyntaxKind.ClassDeclaration) {
            // This is a top level class, get its symbol
            output.push(inspectClass((<ts.ClassDeclaration>node)));
            // No need to walk any further, class expressions/inner declarations
            // cannot be exported
        }
        else if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
            // This is a namespace, visit its children
            ts.forEachChild(node, visit);
        }
    }

    /** Inspect a class symbol infomration */
    function inspectClass(node: ts.ClassDeclaration): IModel {
        let symbol = checker.getSymbolAtLocation(node.name);
        let className = symbol.getName();
        let entity: IModel = {
            name: className,
            documentation: ts.displayPartsToString(symbol.getDocumentationComment()),
            collectionName: className,
            schema: undefined,
        };
        //console.log("class: "+require('util').inspect(node,null,1));
        // get decorators
        if (node.decorators) {
            let decorators = node.decorators.map(inspectDecorator);
            decorators && decorators.forEach(function(d) {
                switch(d.name) {
                    case "collection":
                        entity.collectionName = d.args && d.args.name || entity.collectionName;
                        break;
                    default:
                        throw new Error(`Bad decorator [${d.name}] on Class ${className}`);
                }
            });
        }

        if (node.members) {
            let members = node.members.map(inspectMembers);
            entity.schema = new Schema(members && members.reduce(function(prev: any, curr: any) {
                if (curr.value) prev[curr.name] = curr.value;
                return prev;
            }, {}));
        }
        return entity;
    }

    function inspectMembers(member: ts.Declaration | ts.VariableDeclaration) {
        //console.log("member: "+require('util').inspect(member,null,4));

        function log(prefix: String, obj: any) {
           // console.log(`${prefix}: ${require('util').inspect(obj,null,1)}`);
        }

        let symbol = checker.getSymbolAtLocation(member.name);
        let type: String, value: String;
        
        switch(member.kind) {
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
                log("Property",member);
                type = checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration));
                log("type", type);
                value = type
                break;
            default: 
                console.log(`# Warning: Syntax kind '${ts.SyntaxKind[member.kind]}' not yet managed`);
        }
        return {
            name: symbol.getName(),
            value: value
        }
    }

    function inspectDecorator(decorator: ts.Decorator) {
        //console.log("decorator: "+require('util').inspect(decorator,null,4));
        let expression = <ts.CallExpression>decorator.expression;
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
    }

    /** True if this is visible outside this file, false otherwise */
    function isNodeExported(node: ts.Node): boolean {
        return (node.flags & ts.NodeFlags.Export) !== 0 || (node.parent && node.parent.kind === ts.SyntaxKind.SourceFile);
    }
}