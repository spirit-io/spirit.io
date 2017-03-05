import { IValidator, IModelFactory, IField } from '../interfaces';
import * as diagsHelper from '../utils';

export class InsertOnlyValidator implements IValidator {
    public name: string = 'insertOnly';
    validate(instance: any, factory: IModelFactory) {
        // validation occurs only on updates
        if (instance.$snapshot) {
            let fields: Map<string, IField> = factory.$fields;
            for (var [key, field] of fields) {
                let isInsertonly = field.hasMetadata(this.name);
                if (isInsertonly && instance.$snapshot[key] !== undefined && instance.$snapshot[key].toString() !== instance[key].toString()) {
                    diagsHelper.addInstanceDiagnose(instance, 'error', `ValidatorError: Property \`${key}\` can't be modified because it is an insert only property.`, new Error().stack);

                }
            }
        }

    }
}