import { model, required, reverse, embedded, insertonly, hook, route, invisible } from '../../lib/decorators';
import { ModelBase } from '../../lib/base';
import * as diagsHelper from '../../lib/utils';
import { IActionParameters } from '../../lib/interfaces';

export enum TestEnum {
    A,
    B,
    C,
    D
}

@model({ datasource: 'mock' })
export class MyModelRel extends ModelBase {
    constructor(data) {
        super(data);
    }

    @required
    p1: string;

    relinv: MyModel;

    relinvs: MyModel[];

    @invisible(true)
    pInvisible1: string

    @invisible((instance) => {
        return instance.p1 === 'prop1';
    })
    pInvisible2: string

    readonly readOnlyProp: string = 'readOnlyVal';

    pEnum: TestEnum
}

@model()
export class MyModelRelExtend extends MyModelRel {
    constructor(data) {
        super(data);
    }
    @insertonly
    p2: string;
}

@model()
export class MyModel extends ModelBase {
    constructor() {
        super();
    }
    @required
    @required // twice for coverage
    pString: string;

    pNumber: number;

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
        diagsHelper.addInstanceDiagnose(this, 'info', `aMethod has been called with parameters ${JSON.stringify(params)}`);
        return this.save({}, {}, {});
    }

    aMethodThatThrow(params: any): string {
        throw new Error("Test error");
    }

    static aService(params: any): any {
        return { c: (params.a + params.b).toFixed(2) };
    }

    static aServiceThatThrow(params: any): any {
        throw new Error('Test error');
    }

    @hook('beforeSave')
    static beforeSave(instance: MyModel) {
        instance.aMethod('test');
    }


}

@model({ persistent: false })
export class MyNotPersistentModel {
    @route('get', '/sumWithQueryStringParams')
    myGetFunc(params: IActionParameters) {
        let a = parseFloat(params.query.a);
        let b = parseFloat(params.query.b);
        params.res$.status(200).send({ sum: Math.round((a + b) * 100) / 100 });
    }

    @route('post', '/sumWithBodyParams')
    myPostFunc(params: IActionParameters) {
        let a = params.body.a;
        let b = params.body.b;
        params.res$.status(200).send({ sum: Math.round((a + b) * 100) / 100 });
    }
}

