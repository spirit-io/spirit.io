import { IValidator, IField, IModelFactory } from '../interfaces';
import * as diagsHelper from '../utils';

export class RequiredValidator implements IValidator {
    public name: string = 'required';
    validate(instance: any, factory: IModelFactory) {
        let fields: Map<string, IField> = factory.$fields;
        for (var [key, field] of fields) {
            let isRequired = field.hasMetadata('required');
            if (isRequired && instance[key] == null) {
                //console.log("Instance:", instance);
                diagsHelper.addInstanceDiagnose(instance, 'error', `ValidatorError: Property \`${key}\` is required.`, new Error().stack);
            }
        }
    }
}