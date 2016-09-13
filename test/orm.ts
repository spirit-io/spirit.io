/**
 * Module dependencies.
 */
const chai = require('chai');
import { _ } from 'streamline-runtime';
import * as fs from "fs";

import * as spirit from '../lib/core';
import { User } from '../lib/models';

const cb = (err, res) => {
    if (err) throw err;
    return res;
}
let server = require('../index')('3001');
server.start(cb);
/**
 * Globals
 */

var expect = chai.expect;

/**
 * Unit tests
 */
describe('User Model Unit Tests:', () => {

    describe('2 + 4', () => {
        it('should be 6', (_) => {
                User.remove(_, "57d7b8ef3b161925b0c565a2");
                let u1: User = new User({
                    _id: "57d7b8ef3b161925b0c565a2",
                    userName: "User1",
                    firstName: "myName",
                    lastName: "Chambard",
                    email: "teddy.chambard@sage.com"
                });
                u1.save(_);
                console.log("U1: ",JSON.stringify(u1));

                let u2: User = <User>User.fetchInstance(_,"57d6b1bf2f643b2c7cb2da42");
                console.log("U2:",JSON.stringify(u2));
                u2.firstName = "Aurelien";
                u2.lastName = "Pisu";

                console.log(u2.hello());
                u2.save(_);

                let u3: User = <User>User.fetchInstance(_,"57d6b1bf2f643b2c7cb2da42");
                console.log("U3:",JSON.stringify(u3));

                let users: User[] = <User[]>User.fetchInstances(_, {lastName:"Chambard"});
                console.log("Users: "+JSON.stringify(users,null,2));

        });

        it('should not be 7', (done) => {
            expect(2+4).to.not.equals(7);
            done();
        });
    });
});