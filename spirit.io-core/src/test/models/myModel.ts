/* tslint:disable:prefer-array-literal */
import { model, required, reverse, embedded, insertonly, hook, route, invisible } from '../../lib/decorators';
import { ModelBase } from '../../lib/base';
import { Request, Response, NextFunction } from 'express';
import * as diagsHelper from '../../lib/utils';

export enum TestEnum {
    A,
    B,
    C,
    D,
}

@model({ datasource: 'mock' })
export class MyModelRel extends ModelBase {

    @required
    public p1: string;

    public relinv: MyModel;

    public relinvs: MyModel[];

    @invisible(true)
    public pInvisible1: string;

    @invisible((instance) => {
        return instance.p1 === 'prop1';
    })
    public pInvisible2: string;

    public readonly readOnlyProp: string = 'readOnlyVal';

    public pEnum: TestEnum;
    constructor(data) {
        super(data);
    }
}

@model()
export class MyModelRelExtend extends MyModelRel {
    @insertonly
    public p2: string;
    constructor(data) {
        super(data);
    }
}

@model()
export class MyModel extends ModelBase {

    public static aService(params: any): any {
        return { c: (params.a + params.b).toFixed(2) };
    }

    public static aServiceThatThrow(params: any): any {
        throw new Error('Test error');
    }

    @hook('beforeSave')
    public static beforeSave(instance: MyModel) {
        instance.aMethod('test');
    }
    @required
    @required // twice for coverage
    public pString: string;

    public pNumber: number;

    public pDate: Date;

    public pBoolean: boolean;

    @required
    public aString: Array<string>;

    public aNumber: Array<number>;
    public aDate: Array<Date>;
    public aBoolean: Array<boolean>;

    @embedded
    public rel: MyModelRel;
    public rels: MyModelRel[];

    @reverse('relinv')
    public inv: MyModelRel;

    @reverse('relinvs')
    public invs: MyModelRel[];
    constructor() {
        super();
    }

    public aMethod(params: any): string {
        if (params.pString) this.pString = params.pString;
        diagsHelper.addInstanceDiagnose(this, 'info', `aMethod has been called with parameters ${JSON.stringify(params)}`);
        return this.save({}, {}, {});
    }

    public aMethodThatThrow(params: any): string {
        throw new Error('Test error');
    }

}

@model({ persistent: false })
export class MyNotPersistentModel {
    @route('get', '/sumWithQueryStringParams')
    public myGetFunc(req: Request, res: Response, next: NextFunction) {
        const a = parseFloat(req.query.a);
        const b = parseFloat(req.query.b);
        res.status(200).send({ sum: Math.round((a + b) * 100) / 100 });
        next();
    }

    @route('post', '/sumWithBodyParams')
    public myPostFunc(req: Request, res: Response, next: NextFunction) {
        const a = req.body.a;
        const b = req.body.b;
        res.status(200).send({ sum: Math.round((a + b) * 100) / 100 });
        next();
    }
}
