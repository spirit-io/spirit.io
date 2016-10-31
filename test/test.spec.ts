import { _ } from 'streamline-runtime';
import { Fixtures } from './fixtures';
import { Server } from '../lib/application';
import { MyModel, MyModelRel } from './models/myModel';
import { ModelRegistry, AdminHelper } from '../lib/core';
import { IModelFactory } from '../lib/interfaces';
import { helper as objectHelper } from '../lib/utils';
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

let trace;// = console.log;
let server: Server;

describe('test global context', () => {
    before(function (done) {
        this.timeout(10000);
        Fixtures.setup(function (err, res) {
            if (err) throw err;
            server = res;
            _.context.test = 'abc';
        }, done);
    });
    it('test1', (done) => {
        Fixtures.execAsync(done, function (_) {
            // chai.request(server.app).get('/').end(function (err, res) {
            //     if (err) console.log("ERROR:", err.message);


            // });
            let res = Fixtures.get(_, '/api/v1/myModel');
            expect(res).to.have.status(200);
            console.log("Res.body:", res.body);

            console.log("1.context.test:", _.context.test);
            _.context.test = 'abc1';

        });
    });

    it('test2', (done) => {
        Fixtures.execAsync(done, function (_) {
            console.log("2.context.test:", _.context.test);
            _.context.test = 'abc2';
        });
    });

    it('test3', (done) => {
        Fixtures.execAsync(done, function (_) {
            console.log("3.context.test:", _.context.test);
        });
    });

});