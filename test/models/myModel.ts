import { collection, unique, required, index, reverse } from '../../lib/decorators';
import { ModelBase } from '../../lib/base';

@collection({datasource: 'ds'})
export class MyModelRel extends ModelBase {
    constructor(data) {
        super(data);
    }
    p1: string
    relinv: MyModel;
    relinvs: MyModel[]
}

@collection()
export class MyModel extends ModelBase {
    constructor() {
        super();
    }
    @required
    @required // twice for coverage
    pString: string;

    @unique
    pNumber: number;

    @index
    pDate: Date;

    pBoolean: boolean;

    @required
    aString: Array<string>;
    
    aNumber: Array<number>;
    aDate: Array<Date>;
    aBoolean: Array<boolean>;

    rel: MyModelRel;
    rels: MyModelRel[];

    @reverse('relinv')
    inv: MyModelRel;

    @reverse('relinvs')
    invs: MyModelRel[];
}

