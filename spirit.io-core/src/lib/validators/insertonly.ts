import { IValidator, IModelFactory, IField } from '../interfaces';
import * as diagsHelper from '../utils';

export class InsertOnlyValidator implements IValidator {
    public name: string = 'insertOnly';
    public validate(instance: any, factory: IModelFactory) {
        // validation occurs only on updates
        if (instance.$snapshot) {
            const fields: Map<string, IField> = factory.$fields;
            for (const [key, field] of fields) {
                const isInsertonly = field.hasMetadata(this.name);
                if (isInsertonly && instance.$snapshot[key] !== undefined && instance.$snapshot[key] !== instance[key]) {
                    diagsHelper.addInstanceDiagnose(instance, 'error',
                        `ValidatorError: Property \`${key}\` can't be modified because it is an insert only property.`, new Error().stack);

                }
            }
        }

    }
}
