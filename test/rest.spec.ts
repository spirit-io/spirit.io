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

            // // create 3 more
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

    it('update simple instance should work and return correct values', (done) => {
        Fixtures.execAsync(done, function (_) {
            let resp = Fixtures.put(_, '/api/v1/myModelRel/' + myModelRels[0], { p1: "prop1updated" });
            expect(resp.status).to.equal(200);
            let body = JSON.parse(resp.body);
            expect(body.p1).to.equal("prop1updated");
            expect(body._id).to.be.a("string");
            expect(body._createdAt).to.be.not.null;
            expect(body._updated).to.be.not.null;
            expect(new Date(body._createdAt)).to.be.a("Date");
            expect(new Date(body._updated)).to.be.a("Date");
        });
    });

    it('read updated instance should return correct values', (done) => {
        Fixtures.execAsync(done, function (_) {
            let resp = Fixtures.get(_, '/api/v1/myModelRel/' + myModelRels[0]);
            expect(resp.status).to.equal(200);
            let body = JSON.parse(resp.body);
            expect(body.p1).to.equal("prop1updated");
            expect(body._id).to.be.a("string");
            expect(body._createdAt).to.be.not.null;
            expect(body._updated).to.be.not.null;
            expect(new Date(body._createdAt)).to.be.a("Date");
            expect(new Date(body._updated)).to.be.a("Date");

            console.log("Storage content:\n\n" + JSON.stringify(Fixtures.dumpStorage(), null, 2));
        });
    });

});