import { Fixtures } from './fixtures';
import { Server } from '../lib/application';
import { Registry, AdminHelper } from '../lib/core';
import { IModelFactory } from '../lib/interfaces';
import * as chai from 'chai';
const expect = chai.expect;

import { setup } from 'f-mocha';
// this call activates f-mocha wrapper.
setup();

let trace;// = console.log;
let server: Server;

let myModelMeta = {
    $properties: ['_id', '_createdAt', '_updatedAt', 'pString', 'pNumber', 'pDate', 'pBoolean', 'aString', 'aNumber', 'aDate', 'aBoolean', 'inv', 'invs', 'rel', 'rels'],
    $plurals: ['aString', 'aNumber', 'aDate', 'aBoolean', 'invs', 'rels']
};


describe('Spirit.io common Tests:', () => {

    before(function (done) {
        this.timeout(10000);
        server = Fixtures.setup(done);
    });

    it('config should be not empty', () => {
        expect(server.config).to.not.null;
    });

    it('Try to retrieve a model factory that does not exist should raise an error', () => {
        let err;
        try {
            AdminHelper.model("NotExistingModel");
        } catch (e) {
            err = e.message;
        } finally {
            expect(err).to.equal(`Model factory not found for 'NotExistingModel'`);
        }
    });

    it('prototype should be formatted correctly', () => {
        let myModelFactory: IModelFactory = Registry.getFactory("MyModel");
        trace && trace("$prototype:" + JSON.stringify(myModelFactory.$prototype, null, 2));
        expect(myModelFactory.$prototype).to.have.all.keys(myModelMeta.$properties);
        expect(Array.from(myModelFactory.$fields.keys())).to.have.members(myModelMeta.$properties);
        expect(myModelFactory.$plurals).to.have.members(myModelMeta.$plurals);

        expect(myModelFactory.$prototype._id).to.be.a('object');
        expect(myModelFactory.$prototype._id.type).to.equal('String');
        expect(myModelFactory.$prototype._id.insertOnly).to.be.true;
        expect(myModelFactory.$prototype._createdAt).to.be.a('object');
        expect(myModelFactory.$prototype._createdAt.type).to.equal('Date');
        expect(myModelFactory.$prototype._createdAt.insertOnly).to.be.true;
        expect(myModelFactory.$prototype._updatedAt).to.be.a('object');
        expect(myModelFactory.$prototype._updatedAt.type).to.equal('Date');

        expect(myModelFactory.$prototype.pString).to.be.a('object');
        expect(myModelFactory.$prototype.pString.required).to.equal(true);
        expect(myModelFactory.$prototype.pString.type).to.equal('String');

        expect(myModelFactory.$prototype.pNumber).to.be.a('object');
        expect(myModelFactory.$prototype.pNumber.type).to.equal('Number');

        expect(myModelFactory.$prototype.pDate).to.be.a('object');
        expect(myModelFactory.$prototype.pDate.type).to.equal('Date');

        expect(myModelFactory.$prototype.aString).to.be.a('array');
        expect(myModelFactory.$prototype.aString[0]).to.be.a("object");
        expect(myModelFactory.$prototype.aString[0].required).to.equal(true);
        expect(myModelFactory.$prototype.aString[0].type).to.equal("String");

        expect(myModelFactory.$prototype.aNumber).to.be.a('array');
        expect(myModelFactory.$prototype.aNumber[0].type).to.equal("Number");

        expect(myModelFactory.$prototype.aDate).to.be.a('array');
        expect(myModelFactory.$prototype.aDate[0].type).to.equal("Date");

        expect(myModelFactory.$prototype.aBoolean).to.be.a('array');
        expect(myModelFactory.$prototype.aBoolean[0].type).to.equal("Boolean");

    });
});