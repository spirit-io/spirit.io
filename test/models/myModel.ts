import { collection, unique, required, index, reverse, embedded, readonly, hook } from '../../lib/decorators';
import { ModelBase } from '../../lib/base';

@collection({ datasource: 'mock' })
export class MyModelRel extends ModelBase {
    constructor(data) {
        super(data);
    }
    p1: string;
    relinv: MyModel;
    relinvs: MyModel[];
}

@collection()
export class MyModelRelExtend extends MyModelRel {
    constructor(data) {
        super(data);
    }
    @readonly
    p2: string;
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

    @embedded
    rel: MyModelRel;
    rels: MyModelRel[];

    @reverse('relinv')
    inv: MyModelRel;

    @reverse('relinvs')
    invs: MyModelRel[];

    aMethod(params: any): string {
        if (params.pString) this.pString = params.pString;
        this.save();
        return `aMethod has been called with parameters ${JSON.stringify(params)}`;
    }

    static aService(params: any): any {
        return { c: (params.a + params.b).toFixed(2) };
    }

    @hook('beforeSave')
    static beforeSave(instance: MyModel) {
        instance.aMethod('test');
    }
}

