import { wait } from 'f-promise';
import { IModelFactory } from '../interfaces';
import { Registry } from '../core';
import * as fs from "mz/fs";
import * as debug from 'debug';

const trace = debug('sio:imports');

export function imports(filePath: string) {
    try {
        let _f: any = wait(fs.readFile(filePath, 'utf8'));
        let _import = JSON.parse(_f);
        let models = Object.keys(_import);
        models.forEach(key => {
            let mf: IModelFactory = Registry.getFactory(key);
            let elts = _import[key];
            elts.forEach(elt => {
                mf.helper.saveInstance(mf.createNew(), elt);
                trace(key + " created with data:", JSON.stringify(elt, null, 2));
            });
        });
    } catch (e) {
        trace("ERROR: ", e.$diagnoses || e.stack);
    }
}