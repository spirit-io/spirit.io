import { collection, unique, required, reverse } from '../../lib/decorators';
import { ModelBase } from '../../lib/base';

@collection()
export class MyModel extends ModelBase {
    constructor() {
        super()
    }
    @required
    pString: string;
    pNumber: number;
    pDate: Date;
    pBoolean: boolean;

    aString: Array<string>;
    aNumber: Array<number>;
    aDate: Array<Date>;
    aBoolean: Array<boolean>;
}