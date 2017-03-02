import { Fixtures } from './fixtures';
import { helper as objectHelper } from '../lib/utils';
import { setup } from 'f-mocha';

import * as chai from 'chai';
const expect = chai.expect;

import { Seneca } from '../lib/core';

// this call activates f-mocha wrapper.
setup();

describe('*** Spirit.io seneca services Tests ***', () => {
    before(function (done) {
        this.timeout(10000);
        Fixtures.setup(done);
    });

    it('query with invalid where filter should throw an error', () => {
        expect(() => Seneca.act('model:MyModel,action:query', { where: 'badJson' })).to.throw('Invalid where filter: badJson');
    });

    it('query should return empty array', () => {
        let body = Seneca.act('model:MyModel,action:query');
        expect(body).to.be.a('array');
        expect(body.length).to.equal(0);
    });

    it('read should return not found', () => {
        expect(() => Seneca.act('model:MyModel,action:read', { id: '1234' })).to.throw('resource not found');

    });

    it('create simple instance should work', () => {
        let body = Seneca.act('model:MyModelRel,action:create', { body: { p1: "prop1", pInvisible1: "invisble1", pInvisible2: "invisible2" } });
        expect(body.p1).to.equal("prop1");
        expect(body.pInvisible1).to.be.undefined;
        expect(body.pInvisible2).to.be.undefined;
        expect(body.id).to.be.a("string");
        expect(body._createdAt).to.be.not.null;
        expect(body._updated).to.be.not.null;
        expect(new Date(body._createdAt)).to.be.a("Date");
        expect(new Date(body._updated)).to.be.a("Date");
    });

    it('create simple instance with invisible fields should work and return values according to conditions', () => {
        // create 2 more
        let body = Seneca.act('model:MyModelRel,action:create', { body: { p1: "prop2", pInvisible1: "invisble1", pInvisible2: "invisible2" } });
        expect(body.p1).to.equal("prop2");
        expect(body.pInvisible1).to.be.undefined;
        expect(body.pInvisible2).to.be.equal('invisible2'); // invisible field only when p1 equals 'prop1'

        Seneca.act('model:MyModelRel,action:create', { body: { p1: "prop3" } });
    });

    it('create simple instance with readonly field modified should ignore it and raise a warning diagnose', () => {
        // create 1 more
        let body = Seneca.act('model:MyModelRel,action:create', { body: { p1: "prop4", readOnlyProp: "testModifyReadOnlyVal" } });
        expect(body.readOnlyProp).to.be.equal("readOnlyVal");
        expect(body.$diagnoses).to.be.not.null;
        expect(body.$diagnoses.length).to.be.equal(1);
        expect(body.$diagnoses[0].$severity).to.be.equal('warn');
        expect(body.$diagnoses[0].$message).to.be.equal(`Property 'readOnlyProp' is readOnly and can't be modified. New value ignored: 'testModifyReadOnlyVal'; Old value kept: 'readOnlyVal'`);
        expect(body.$diagnoses[0].$stack).to.be.undefined;
    });

    let myModelRels = [];

    it('query should return the four created elements', () => {
        let body = Seneca.act('model:MyModelRel,action:query');
        expect(body).to.be.a('array');
        expect(body.length).to.equal(4);
        body.forEach((rel) => {
            myModelRels.push(rel.id);
        });
    });

    it('not expected property should raise an error on creation', () => {
        expect(() => Seneca.act('model:MyModelRel,action:create', { body: { p1: "prop1", p2: "prop2" } })).to.throw(`Property 'p2' does not exist on model 'MyModelRel'`);;
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

        expect(body.id).to.be.a("string");
        expect(body._createdAt).to.be.not.null;
        expect(body._updated).to.be.not.null;
        expect(new Date(body._createdAt)).to.be.a("Date");
        expect(new Date(body._updated)).to.be.a("Date");
    }

    let myModel = [];
    let data: any = {}
    it('create complex instance should work and return correct values', () => {
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
        let body = Seneca.act('model:MyModel,action:create', { body: data });
        checkComplexInstance(body, 's0');
        myModel.push(body.id);
    });

    it('update complex instance with all values should work and return correct values', () => {
        data.pString = "s0updated";
        let body = Seneca.act('model:MyModel,action:update', { id: myModel[0], body: data });
        checkComplexInstance(body, 's0updated');
    });

    it('read updated instance should return correct values', () => {
        let body = Seneca.act('model:MyModel,action:read', { id: myModel[0] });
        checkComplexInstance(body, 's0updated');
    });

    it('patch complex instance with only one property should work and return correct values', () => {
        let body = Seneca.act('model:MyModel,action:patch', { id: myModel[0], body: { pString: "s0patched" } });
        checkComplexInstance(body, 's0patched');
    });

    it('read singular reference should work and return correct values', () => {
        let body = Seneca.act('model:MyModel,action:read', {
            id: myModel[0],
            ref: 'inv'
        });
        let ref = Seneca.act('model:MyModelRel,action:read', { id: myModelRels[0] });
        expect(objectHelper.areEqual(body, ref)).to.equal(true);
    });

    it('query with includes should return expected elements and references', () => {
        // simple string include
        let body = Seneca.act('model:MyModel,action:query', {
            includes: 'inv'
        });
        // simple object include
        let body2 = Seneca.act('model:MyModel,action:query', {
            includes: { path: "inv" }
        });

        expect(body).to.be.a('array');
        expect(objectHelper.areEqual(body, body2)).to.be.true;
        expect(body.length).to.equal(1);
        expect(body[0].inv).to.be.a('object');
        expect(body[0].inv.id).to.equal(myModelRels[0]);
        expect(body[0].inv.id).to.be.a("string");
        expect(body[0].inv.p1).to.equal('prop1');
        expect(body[0].inv._createdAt).to.be.not.null;
        expect(body[0].inv._updated).to.be.not.null;
        expect(new Date(body[0].inv._createdAt)).to.be.a("Date");
        expect(new Date(body[0].inv._updated)).to.be.a("Date");

        // string include with select
        body = Seneca.act('model:MyModel,action:query', {
            includes: 'inv.p1'
        });
        expect(body).to.be.a('array');
        expect(body.length).to.equal(1);
        expect(body[0].inv).to.be.a('object');
        expect(body[0].inv.id).to.equal(myModelRels[0]);
        expect(body[0].inv.id).to.be.a("string");
        expect(body[0].inv.p1).to.equal('prop1');
        expect(body[0].inv._createdAt).to.be.undefined;
        expect(body[0].inv._updated).to.be.undefined;

        // object include with select
        body = Seneca.act('model:MyModel,action:query', {
            includes: { path: "inv", select: "_createdAt" }
        });
        expect(body).to.be.a('array');
        expect(body.length).to.equal(1);
        expect(body[0].inv).to.be.a('object');
        expect(body[0].inv.id).to.equal(myModelRels[0]);
        expect(body[0].inv.id).to.be.a("string");
        expect(body[0].inv.p1).to.be.undefined;
        expect(body[0].inv._createdAt).to.be.not.null;
        expect(body[0].inv._updated).to.be.undefined;
        expect(new Date(body[0].inv._createdAt)).to.be.a("Date");

        // multiple include with select on one of them
        body = Seneca.act('model:MyModel,action:query', {
            includes: 'inv.p1,rels'
        });
        expect(body).to.be.a('array');
        expect(body.length).to.equal(1);
        expect(body[0].inv).to.be.a('object');
        expect(body[0].inv.id).to.equal(myModelRels[0]);
        expect(body[0].inv.id).to.be.a("string");
        expect(body[0].inv.p1).to.equal('prop1');
        expect(body[0].inv._createdAt).to.be.undefined;
        expect(body[0].inv._updated).to.be.undefined;

        expect(body[0].rels).to.be.a('array');
        expect(body[0].rels.length).to.equal(2);
        expect(body[0].rels[0].id).to.be.a("string");
        expect(body[0].rels[0].p1).to.equal('prop2');
        expect(body[0].rels[0]._createdAt).to.be.not.null;
        expect(body[0].rels[0]._updated).to.be.not.null;
        expect(new Date(body[0].rels[0]._createdAt)).to.be.a("Date");
        expect(new Date(body[0].rels[0]._updated)).to.be.a("Date");

        // bad object include should throw an error
        expect(() => Seneca.act('model:MyModel,action:query', {
            includes: '{wrong}'
        })).to.throw('JSON includes filter is not valid');
    });

    it('update complex instance with only one property should work and return only provided values', () => {
        let body = Seneca.act('model:MyModel,action:update', {
            id: myModel[0],
            body: { pString: "s0updatedAgain", pNumber: 0, aString: ['a'] }
        });

        expect(body.pString).to.equal("s0updatedAgain");
        expect(body.pNumber).to.equal(0);
        expect(body.pDate).to.equal(undefined);
        expect(body.pBoolean).to.equal(undefined);
        expect(body.aString).to.be.not.empty;
        expect(body.aNumber).to.be.empty;
        expect(body.aBoolean).be.empty;
        expect(body.inv).to.equal(undefined);
        expect(body.inv).to.equal(undefined);
        expect(body.rels).to.be.empty;
        expect(body.invs).to.be.empty;

        expect(body.id).to.be.a("string");
        expect(body._createdAt).to.be.not.null;
        expect(body._updated).to.be.not.null;
        expect(new Date(body._createdAt)).to.be.a("Date");
        expect(new Date(body._updated)).to.be.a("Date");
    });

    it('execute instance method should work and saved instance should be updated', () => {
        let body = Seneca.act('model:MyModel,action:execute', {
            id: myModel[0],
            name: 'aMethod',
            body: { pString: "pString updated by aMethod call", anotherParam: 'test' }
        });
        // TODO: manage responses structure with diagnoses maybe ?
        body = Seneca.act('model:MyModel,action:read', { id: myModel[0] });
        expect(body.pString).to.equal("pString updated by aMethod call");
    });

    it('execute instance method that throw an exception should return diagnoses', () => {
        expect(() => Seneca.act('model:MyModel,action:execute', {
            id: myModel[0],
            name: 'aMethodThatThrow',
            body: {}
        })).to.throw(`Test error`);
    });

    it('execute instance method that does not exist should throw an error', () => {
        expect(() => Seneca.act('model:MyModel,action:execute', {
            id: myModel[0],
            name: 'aMethodThatDoesNotExists',
            body: {}
        })).to.throw(`Method 'aMethodThatDoesNotExists' does not exist on model 'MyModel'`);
    });

    it('execute instance method on an instance that does not exist should throw an error', () => {
        expect(() => Seneca.act('model:MyModel,action:execute', {
            id: '1234',
            name: 'aaa',
            body: {}
        })).to.throw(`Instance not found`);
    });

    it('execute model service should work and return expected value', () => {
        let body = Seneca.act('model:MyModel,action:invoke', {
            name: 'aService',
            body: { a: 2.22, b: 3.33 }
        });
        expect(body.c).to.equal('5.55');
    });

    it('execute model service that throw an exception should return diagnoses', () => {
        expect(() => Seneca.act('model:MyModel,action:invoke', {
            name: 'aServiceThatThrow',
            body: {}
        })).to.throw(`Test error`);
    });

    it('execute model service that does not exist should throw an error', () => {
        expect(() => Seneca.act('model:MyModel,action:invoke', {
            name: 'aServiceThatDoesNotExists',
            body: {}
        })).to.throw(`Service 'aServiceThatDoesNotExists' does not exist on model 'MyModel'`);
    });

    it('deleting non exiting document should return not found', () => {
        expect(() => Seneca.act('model:MyModel,action:remove', {
            id: '1'
        })).to.throw('resource not found');
    });

    it('query should return nothing after deleting all elements', () => {
        myModelRels.forEach((r) => {
            Seneca.act('model:MyModelRel,action:remove', {
                id: r
            });
        });


        let body = Seneca.act('model:MyModelRel,action:query');
        expect(body).to.be.a('array');
        expect(body.length).to.equal(0);

        myModel.forEach((m) => {
            Seneca.act('model:MyModel,action:remove', {
                id: m
            });
        });

        body = Seneca.act('model:MyModel,action:query');
        expect(body).to.be.a('array');
        expect(body.length).to.equal(0);
    });

    it('get request with querystring parameters on non persistent model\'s route', () => {
        let resp = Fixtures.get('/api/v1/myNotPersistentModel/sumWithQueryStringParams?a=2.22&b=3.33');
        expect(resp.status).to.be.equal(200);
        let body = JSON.parse(resp.body);
        expect(body.sum).to.be.equal(5.55);
    });

    it('post request with body parameters on non persistent model\'s route', () => {
        let resp = Fixtures.post('/api/v1/myNotPersistentModel/sumWithBodyParams', {
            a: 2.22,
            b: 3.33
        });
        expect(resp.status).to.be.equal(200);
        let body = JSON.parse(resp.body);
        expect(body.sum).to.be.equal(5.55);
    });


});