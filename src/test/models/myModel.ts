import { model, required, reverse, embedded, readonly, hook, route, invisible } from '../../lib/decorators';
import { ModelBase } from '../../lib/base';
import { Request, Response, NextFunction } from 'express';
import * as diagsHelper from '../../lib/utils';

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
}

@model()
export class MyModelRelExtend extends MyModelRel {
    constructor(data) {
        super(data);
    }
    @readonly
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
    myGetFunc(req: Request, res: Response, next: NextFunction) {
        let a = parseFloat(req.query.a);
        let b = parseFloat(req.query.b);
        res.status(200).send({ sum: Math.round((a + b) * 100) / 100 });
        next();
    }

    @route('post', '/sumWithBodyParams')
    myPostFunc(req: Request, res: Response, next: NextFunction) {
        let a = req.body.a;
        let b = req.body.b;
        res.status(200).send({ sum: Math.round((a + b) * 100) / 100 });
        next();
    }
}

