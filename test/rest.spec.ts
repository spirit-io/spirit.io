import { _ } from 'streamline-runtime';
import { Fixtures } from './fixtures';
import { Server } from '../lib/application';
import { MyModel, MyModelRel } from './models/myModel';
import { ModelRegistry, AdminHelper } from '../lib/core';
import { IModelFactory } from '../lib/interfaces';
import { helper as objectHelper } from '../lib/utils';
const chai = require('chai');
const expect = chai.expect;

let trace;// = console.log;
let server: Server;

let myModelMeta = {
    $properties: ['_id', '_createdAt', '_updatedAt', 'pString', 'pNumber', 'pDate', 'pBoolean', 'aString', 'aNumber', 'aDate', 'aBoolean', 'inv', 'invs', 'rel', 'rels'],
    $plurals: ['aString', 'aNumber', 'aDate', 'aBoolean', 'invs', 'rels']
};



describe('Spirit.io REST Express routes Tests:', () => {
    before(function (done) {
        this.timeout(10000);
        Fixtures.setup(function (err, res) {
            if (err) throw err;
            server = res;
        }, done);
    });

    it('query with invalid where filter should throw an error', (done) => {
        Fixtures.execAsync(done, function (_) {
            let resp = Fixtures.get(_, '/api/v1/myModel?where=badJson');

            let body = JSON.parse(resp.body);
            expect(resp.status).to.equal(500);
            expect(body.error).to.equal(`Error: Invalid where filter: badJson`);
        });
    });

    it('query should return empty array', (done) => {
        Fixtures.execAsync(done, function (_) {
            let resp = Fixtures.get(_, '/api/v1/myModel');
            let body = JSON.parse(resp.body);
            expect(resp.status).to.equal(200);
            expect(body).to.be.a('array');
            expect(body.length).to.equal(0);
        });
    });

    it('read should return not found', (done) => {
        Fixtures.execAsync(done, function (_) {
            let resp = Fixtures.get(_, '/api/v1/myModel/1234');
            expect(resp.status).to.equal(404);
        });
    });

    it('create simple instance should work', (done) => {
        Fixtures.execAsync(done, function (_) {
            let resp = Fixtures.post(_, '/api/v1/myModelRel', { p1: "prop1" });
            let body = JSON.parse(resp.body);
            expect(resp.status).to.equal(201);
            expect(body.p1).to.equal("prop1");
            expect(body._id).to.be.a("string");
            expect(body._createdAt).to.be.not.null;
            expect(body._updated).to.be.not.null;
            expect(new Date(body._createdAt)).to.be.a("Date");
            expect(new Date(body._updated)).to.be.a("Date");

            // create 3 more
            Fixtures.post(_, '/api/v1/myModelRel', { p1: "prop2" });
            Fixtures.post(_, '/api/v1/myModelRel', { p1: "prop3" });
            Fixtures.post(_, '/api/v1/myModelRel', { p1: "prop4" });
        });
    });

    let myModelRels = [];

    it('query should return the four created elements', (done) => {
        Fixtures.execAsync(done, function (_) {
            let resp = Fixtures.get(_, '/api/v1/myModelRel');
            let body = JSON.parse(resp.body);
            expect(resp.status).to.equal(200);
            expect(body).to.be.a('array');
            expect(body.length).to.equal(4);
            body.forEach((rel) => {
                myModelRels.push(rel._id);
            });
        });
    });

    it('not expected property should raise an error on creation', (done) => {
        Fixtures.execAsync(done, function (_) {
            let resp = Fixtures.post(_, '/api/v1/myModelRel', { p1: "prop1", p2: "prop2" });
            let body = JSON.parse(resp.body);
            expect(resp.status).to.equal(500);
            expect(body.error).to.equal(`Error: Property 'p2' does not exist on model 'MyModelRel'`);
        });
    });


    function checkComplexInstance(body, pStringValue) {
        expect(body.pString).to.equal(pStringValue);
        expect(body.pNumber).to.equal(20);
        expect(new Date(body.pDate)).to.be.a("Date");
        expect(body.pBoolean).to.equal(true);
        expect(body.aString).to.have.members(['s1', 's2']);
        expect(body.aNumber).to.have.members([0, 1, 2]);
        expect(body.aBoolean).to.have.members([false, true, false]);
        expect(body.inv).to.be.a("string");
        expect(body.inv).to.equal(myModelRels[0]);
        expect(body.rels).to.have.members([myModelRels[1], myModelRels[2]]);

        expect(body._id).to.be.a("string");
        expect(body._createdAt).to.be.not.null;
        expect(body._updated).to.be.not.null;
        expect(new Date(body._createdAt)).to.be.a("Date");
        expect(new Date(body._updated)).to.be.a("Date");
    }

    let myModel = [];
    let data: any = {}
    it('create complex instance should work and return correct values', (done) => {
        Fixtures.execAsync(done, function (_) {
            data = {
                "pString": "s0",
                "pNumber": 20,
                "pDate": new Date(),
                "pBoolean": true,
                "aString": ["s1", "s2"],
                "aNumber": [0, 1, 2],
                "aDate": [new Date(), new Date(Date.now() - 10000)],
                "aBoolean": [false, true, false],
                "inv": myModelRels[0],
                "rels": [myModelRels[1], myModelRels[2]]
            };
            let resp = Fixtures.post(_, '/api/v1/myModel', data);

            expect(resp.status).to.equal(201);
            let body = JSON.parse(resp.body);
            checkComplexInstance(body, 's0');
            myModel.push(body._id);
        });
    });

    it('update complex instance with all values should work and return correct values', (done) => {
        Fixtures.execAsync(done, function (_) {
            data.pString = "s0updated";
            let resp = Fixtures.put(_, '/api/v1/myModel/' + myModel[0], data);
            expect(resp.status).to.equal(200);
            let body = JSON.parse(resp.body);
            checkComplexInstance(body, 's0updated');

        });
    });

    it('read updated instance should return correct values', (done) => {
        Fixtures.execAsync(done, function (_) {
            let resp = Fixtures.get(_, '/api/v1/myModel/' + myModel[0]);
            expect(resp.status).to.equal(200);
            let body = JSON.parse(resp.body);

            checkComplexInstance(body, 's0updated');
        });
    });

    it('patch complex instance with only one property should work and return correct values', (done) => {
        Fixtures.execAsync(done, function (_) {
            let resp = Fixtures.patch(_, '/api/v1/myModel/' + myModel[0], { pString: "s0patched" });
            expect(resp.status).to.equal(200);
            let body = JSON.parse(resp.body);
            checkComplexInstance(body, 's0patched');
        });
    });

    it('read reference should work and return correct values', (done) => {
        Fixtures.execAsync(done, function (_) {
            let resp = Fixtures.get(_, '/api/v1/myModel/' + myModel[0] + '/inv');
            expect(resp.status).to.equal(200);
            let body = JSON.parse(resp.body);
            let ref = JSON.parse(Fixtures.get(_, '/api/v1/myModelRel/' + myModelRels[0]).body);
            expect(objectHelper.areEqual(body, ref)).to.equal(true);
        });
    });


    it('update complex instance with only one property should work and return only provided values', (done) => {
        Fixtures.execAsync(done, function (_) {
            let resp = Fixtures.put(_, '/api/v1/myModel/' + myModel[0], { pString: "s0updatedAgain", pNumber: 0 });
            expect(resp.status).to.equal(200);
            let body = JSON.parse(resp.body);

            expect(body.pString).to.equal("s0updatedAgain");
            expect(body.pNumber).to.equal(0);
            expect(body.pDate).to.equal(undefined);
            expect(body.pBoolean).to.equal(undefined);
            expect(body.aString).to.equal(undefined);
            expect(body.aNumber).to.equal(undefined);
            expect(body.aBoolean).to.equal(undefined);
            expect(body.inv).to.equal(undefined);
            expect(body.inv).to.equal(undefined);
            expect(body.rels).to.equal(undefined);

            expect(body._id).to.be.a("string");
            expect(body._createdAt).to.be.not.null;
            expect(body._updated).to.be.not.null;
            expect(new Date(body._createdAt)).to.be.a("Date");
            expect(new Date(body._updated)).to.be.a("Date");
        });
    });

});