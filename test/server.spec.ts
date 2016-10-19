import { _ } from 'streamline-runtime';
import { Fixtures } from './fixtures/setup';
import { Server } from '../lib/application';
const expect = require('chai').expect;

let server: Server;
before(function(done) {
    Fixtures.setup(function(err, res) {
        if (err) throw err;
        server = res;
        done();
    });
});

describe('Spirit.io Framework Tests:', () => {

    it('config should be not empty', () => {
        expect(server.config).to.not.null;
    });

});