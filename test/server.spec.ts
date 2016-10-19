import { _ } from 'streamline-runtime';
import { Fixtures } from './fixtures/setup';
import { Server } from '../lib/application';
const expect = require('chai').expect;

let server: Server;
before(function(_) {
    server = Fixtures.setup(_);
});

describe('Spirit.io Framework Tests:', () => {

    it('config should be not empty', (_) => {
        expect(server.config).to.not.null;
    });

});