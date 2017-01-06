import { Fixtures } from './fixtures';
import { Server } from '../lib/application';
import { MyModel, MyModelRel } from './models/myModel';
import { AdminHelper } from '../lib/core';
import { helper as objectHelper } from '../lib/utils';
import * as chai from 'chai';
const expect = chai.expect;

let server: Server;

function removaAllDocuments() {
    // delete all myModelRels
    let db = AdminHelper.model(MyModelRel);
    let rels = db.fetchInstances();
    rels.forEach(function (r) {
        db.deleteInstance(r);
    });
    rels = db.fetchInstances();
    expect(rels.length).to.equal(0);

    // delete all myModels
    db = AdminHelper.model(MyModel);
    rels = db.fetchInstances();
    rels.forEach(function (r) {
        db.deleteInstance(r);
    });
    rels = db.fetchInstances();
    expect(rels.length).to.equal(0);
}

describe('*** Spirit.io ORM Framework Tests ***', () => {

    before(function (done) {
        this.timeout(10000);
        server = Fixtures.setup(done);
    });

    it('Instanciate class should work either with adminHelper or ModelBase methods', () => {
        // this test does not validate populate as it is not the purpose !
        // instanciate class with ModelBase's save method
        let mRel1: MyModelRel = new MyModelRel({ p1: "prop1" });
        mRel1.save();
        expect(mRel1.p1).to.equal("prop1");
        let mRel2: MyModelRel = new MyModelRel({ p1: "prop2" });
        mRel2.save();
        expect(mRel2.p1).to.equal("prop2");
        let mRel3: MyModelRel = new MyModelRel({ p1: "prop3" });
        mRel3 = mRel3.save();
        expect(mRel3.p1).to.equal("prop3");

        mRel3.p1 = "prop3modified";
        mRel3 = mRel3.save();
        expect(mRel3.p1).to.equal("prop3modified");
        // instanciate class with AdminHelper
        let data = {
            "pString": "pString",
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
        db.saveInstance(m1, data);

        expect(m1.id).to.be.a("string");
        expect(m1.createdAt).to.be.a("Date");
        expect(m1.updatedAt).to.be.a("Date");
        expect(m1.serialize()).to.be.a("object");
        expect(m1.pString).to.equal("pString");
        expect(m1.pNumber).to.equal(20);
        expect(m1.pDate).to.be.a("Date");
        expect(m1.pBoolean).to.equal(true);
        expect(m1.aString).to.have.members(['s1', 's2']);
        expect(m1.aNumber).to.have.members([0, 1, 2]);
        expect(m1.aBoolean).to.have.members([false, true, false]);
        expect(m1.inv).to.be.a("object");
        expect(objectHelper.areEqual(m1.inv.serialize(), mRel1.serialize())).to.be.true;
        expect(objectHelper.areEqual(m1.rels[0].serialize(), mRel2.serialize())).to.be.true;
        expect(objectHelper.areEqual(m1.rels[1].serialize(), mRel3.serialize())).to.be.true;

    });

    let relId: string;
    it('Fetch instances should allow to get relations', () => {
        let db = AdminHelper.model(MyModel);
        let rels: MyModel[] = db.fetchInstances();
        expect(rels.length).to.equal(1);
        expect(rels[0].inv).to.be.not.undefined;
        expect(rels[0].inv.p1).to.equal('prop1');
        expect(rels[0].rels).to.be.not.undefined;
        expect(rels[0].rels.length).to.equal(2);
        expect(rels[0].rels[0].p1).to.equal('prop2');
        expect(rels[0].rels[1].p1).to.equal('prop3modified');
        relId = rels[0].getMetadata('_id');
    });

    it('Update instance should allow to know if a property is modified', () => {
        let db = AdminHelper.model(MyModel);
        let rel: MyModel = db.fetchInstance(relId);
        let isModified = rel.isModified('pString');
        expect(isModified).to.be.false;
        rel.pString = "modifiedProp";
        rel.save();
        isModified = rel.isModified('pString');
        expect(isModified).to.be.true;
    });

    it('Add instance\'s diagnose should allow to retrieve it on serialization', () => {
        let db = AdminHelper.model(MyModel);
        let rel: MyModel = db.fetchInstance(relId);
        rel.addDiagnose('info', 'Diagnose added manually');
        let serialized = rel.save(null, null, {});

        let expectedMessages = [
            'Diagnose added manually',
            'aMethod has been called with parameters "test"'
        ]

        expect(serialized.$diagnoses).to.be.not.null;
        expect(serialized.$diagnoses.length).to.be.equal(2);
        expect(serialized.$diagnoses[0].$severity).to.be.equal('info');
        expect(expectedMessages.indexOf(serialized.$diagnoses[0].$message) !== -1).to.be.true;
        expect(serialized.$diagnoses[0].$stackTrace).to.be.undefined;
        expect(serialized.$diagnoses[1].$severity).to.be.equal('info');
        expect(expectedMessages.indexOf(serialized.$diagnoses[1].$message) !== -1).to.be.true;
        expect(serialized.$diagnoses[1].$stackTrace).to.be.undefined;

    });

    it('Fetch instances should return correct results even after deleting some instances', () => {
        let db = AdminHelper.model(MyModelRel);
        let rels = db.fetchInstances();
        expect(rels.length).to.equal(3);

        let rel0 = db.fetchInstance("1234");
        expect(rel0).to.be.null;

        let rel1 = db.fetchInstance(rels[0]._id, {});
        expect(rel1).to.be.not.null;
        expect(objectHelper.areEqual(rel1, rels[0])).to.equal(true);

        db.deleteInstance(rel1);
        expect(db.fetchInstance(rels[0]._id)).to.be.null;
        expect(db.fetchInstances().length).to.equal(2);

        let rel3 = db.fetchInstance(rels[2]._id, {});
        expect(rel3.p1).to.equal("prop3modified");
    });

    it('Delete instances should work as expected', () => {
        removaAllDocuments();
    });

});