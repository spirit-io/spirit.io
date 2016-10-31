import { _ } from 'streamline-runtime';
import { Fixtures } from './fixtures';
import { Server } from '../lib/application';
import { MyModel, MyModelRel } from './models/myModel';
import { ModelRegistry, AdminHelper } from '../lib/core';
import { IModelFactory } from '../lib/interfaces';
import { helper as objectHelper } from '../lib/utils';
const expect = require('chai').expect;

let trace;// = console.log;
let server: Server;

let myModelMeta = {
    $properties: ['_id', '_createdAt', '_updatedAt', 'pString', 'pNumber', 'pDate', 'pBoolean', 'aString', 'aNumber', 'aDate', 'aBoolean', 'inv', 'invs', 'rel', 'rels'],
    $plurals: ['aString', 'aNumber', 'aDate', 'aBoolean', 'invs', 'rels']
};


describe('Spirit.io ORM Framework Tests:', () => {

    before(function (done) {
        this.timeout(10000)
        Fixtures.setup(function (err, res) {
            if (err) throw err;
            server = res;
            done();
        } as any);
    });

    it('config should be not empty', (done) => {
        expect(server.config).to.not.null;
        done();
    });

    it('Try to retrieve a model factory that does not exist should raise an error', (done) => {
        let err;
        try {
            AdminHelper.model("NotExistingModel");
        } catch (e) {
            err = e.message;
        } finally {
            expect(err).to.equal(`Model factory not found for 'NotExistingModel'`);
        }
        done();
    });

    it('prototype should be formatted correctly', (done) => {
        let myModelFactory: IModelFactory = ModelRegistry.getFactory("MyModel");
        trace && trace("$prototype:" + JSON.stringify(myModelFactory.$prototype, null, 2));
        expect(myModelFactory.$prototype).to.have.all.keys(myModelMeta.$properties);
        expect(myModelFactory.$fields).to.have.members(myModelMeta.$properties);
        expect(myModelFactory.$plurals).to.have.members(myModelMeta.$plurals);

        expect(myModelFactory.$prototype._id).to.equal('string');
        expect(myModelFactory.$prototype._createdAt).to.equal('Date');
        expect(myModelFactory.$prototype._updatedAt).to.equal('Date');

        expect(myModelFactory.$prototype.pString).to.be.a('object');
        expect(myModelFactory.$prototype.pString.required).to.equal(true);
        expect(myModelFactory.$prototype.pString.type).to.equal('string');

        expect(myModelFactory.$prototype.pNumber).to.be.a('object');
        expect(myModelFactory.$prototype.pNumber.unique).to.equal(true);
        expect(myModelFactory.$prototype.pNumber.type).to.equal('number');

        expect(myModelFactory.$prototype.pDate).to.be.a('object');
        expect(myModelFactory.$prototype.pDate.index).to.equal(true);
        expect(myModelFactory.$prototype.pDate.type).to.equal('Date');

        expect(myModelFactory.$prototype.aString).to.be.a('array');
        expect(myModelFactory.$prototype.aString[0]).to.be.a("object");
        expect(myModelFactory.$prototype.aString[0].required).to.equal(true);
        expect(myModelFactory.$prototype.aString[0].type).to.equal("string");

        expect(myModelFactory.$prototype.aNumber).to.be.a('array');
        expect(myModelFactory.$prototype.aNumber[0]).to.equal("number");

        expect(myModelFactory.$prototype.aDate).to.be.a('array');
        expect(myModelFactory.$prototype.aDate[0]).to.equal("Date");

        expect(myModelFactory.$prototype.aBoolean).to.be.a('array');
        expect(myModelFactory.$prototype.aBoolean[0]).to.equal("boolean");

        done();
    });

    it('Instanciate class should work either with adminHelper or ModelBase methods', (_) => {
        // this test does not validate populate as it is not the purpose !

        // instanciate class with ModelBase's save method
        let mRel1: MyModelRel = new MyModelRel({ p1: "prop1" });
        mRel1.save(_);
        expect(mRel1.p1).to.equal("prop1");
        let mRel2: MyModelRel = new MyModelRel({ p1: "prop2" });
        mRel2.save(_);
        expect(mRel2.p1).to.equal("prop2");
        let mRel3: MyModelRel = new MyModelRel({ p1: "prop3" });
        mRel3 = mRel3.save(_);
        expect(mRel3.p1).to.equal("prop3");

        mRel3.p1 = "prop3modified";
        mRel3 = mRel3.save(_);
        expect(mRel3.p1).to.equal("prop3modified");
        // instanciate class with AdminHelper
        let data = {
            "pString": "aString",
            "pNumber": 20,
            "pDate": new Date(),
            "pBoolean": true,
            "aString": ["s1", "s2"],
            "aNumber": [0, 1, 2],
            "aDate": [new Date(), new Date('234567')],
            "aBoolean": [false, true, false],
            "inv": mRel1,
            "rels": [mRel2, mRel3]
        };
        let db = AdminHelper.model(MyModel);
        let m1: MyModel = new MyModel();
        db.updateValues(m1, null); // update with null data for test coverage
        db.saveInstance(_, m1, data);
        expect(m1.id).to.be.a("string");
        expect(m1.createdAt).to.be.a("Date");
        expect(m1.updatedAt).to.be.a("Date");
        expect(m1.serialize()).to.be.a("object");
        expect(m1.pString).to.equal("aString");
        expect(m1.pNumber).to.equal(20);
        expect(m1.pDate).to.be.a("Date");
        expect(m1.pBoolean).to.equal(true);
        expect(m1.aString).to.have.members(['s1', 's2']);
        expect(m1.aNumber).to.have.members([0, 1, 2]);
        expect(m1.aBoolean).to.have.members([false, true, false]);
        expect(m1.inv).to.be.a("string");
        expect(m1.inv).to.equal(mRel1.id);
        expect(m1.rels).to.have.members([mRel2.id, mRel3.id]);
    });

    it('Fetch instances should return correct results even after deleting some instances', (_) => {
        let db = AdminHelper.model(MyModelRel);
        let rels = db.fetchInstances(_);
        expect(rels.length).to.equal(3);

        let rel0 = db.fetchInstance(_, "1234");
        expect(rel0).to.be.null;
        let rel1 = db.fetchInstance(_, rels[0]._id, {});
        expect(rel1).to.be.not.null;
        expect(objectHelper.areEqual(rel1, rels[0])).to.equal(true);

        db.deleteInstance(_, rel1);
        expect(db.fetchInstance(_, rels[0]._id)).to.be.null;
        expect(db.fetchInstances(_).length).to.equal(2);

        let rel3 = db.fetchInstance(_, rels[2]._id, {});
        expect(rel3.p1).to.equal("prop3modified");
    });
});