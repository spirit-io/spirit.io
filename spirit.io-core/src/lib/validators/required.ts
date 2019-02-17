import { IValidator, IField, IModelFactory } from '../interfaces';
import * as diagsHelper from '../utils';

export class RequiredValidator implements IValidator {
    public name: string = 'required';
    public validate(instance: any, factory: IModelFactory) {
        const fields: Map<string, IField> = factory.$fields;
        for (const [key, field] of fields) {
            const isRequired = field.hasMetadata(this.name);
            if (isRequired && instance[key] == null) {
                // console.log("Instance:", instance);
                diagsHelper.addInstanceDiagnose(instance, 'error',
                    `ValidatorError: Property \`${key}\` is required.`, new Error().stack);
            }
        }
    }
}
