import { _ } from 'streamline-runtime';
import { User } from '../../lib/models';
import { helper as objectHelper } from '../../lib/utils/object';

const expect = require('chai').expect;

const users: any = {
    keys: ['_id', '_createdAt', '_updatedAt', 'userName', 'password', 'firstName', 'lastName', 'email'],
    data: {
        u1: {
            userName: "user1",
            password: "u1pwd",
            firstName: "u1_firstname",
            lastName: "u1_lastname",
            email: "u1@spirit.com"
        },
        u2: {
            userName: "user2",
            password: "u2pwd",
            firstName: "u2_firstname",
            lastName: "u2_lastname",
            email: "u2@spirit.com"
        }
    }
}
let userIds = [];

/**
 * Unit tests
 */
describe('User Model Unit Tests:', () => {

    describe('CRUD validation', () => {



        it('save user instance with valid values should work', (_) => {

            let data = objectHelper.clone(users.data.u1);
            let u1: User = new User(data);
            u1.save(_);
            expect(u1.toObject()).to.have.all.keys(users.keys);
            // store _id to be able to remove all documents at the end
            userIds.push(u1.id);

            expect(u1.id).to.be.a('object');
            expect(u1.id).to.not.be.null;
            expect(u1.createdAt).to.be.a('date');
            expect(u1.createdAt).to.not.null;
            expect(u1.userName).to.be.a('string');
            expect(u1.userName).to.equal(data.userName);
            expect(u1.firstName).to.be.a('string');
            expect(u1.firstName).to.equal(data.firstName);
            expect(u1.lastName).to.be.a('string');
            expect(u1.lastName).to.equal(data.lastName);
            expect(u1.password).to.be.a('string');
            expect(u1.password).to.equal(data.password);
            expect(u1.email).to.be.a('string');
            expect(u1.email).to.equal(data.email);
        });

        it('save user instance forgetting required value should not work', (_) => {
            // remove email value but change username
            let data = objectHelper.clone(users.data.u2);
            delete data.email;
            let error: Error;
            try {
                new User(data).save(_);
            } catch (e) {
                error = e;
            } finally {
                expect(error).to.not.null;
                expect(error.toString()).to.equal("ValidationError: Path `email` is required.");
            }
        });

        it('save user instance using already existing unique value should not work', (_) => {
            let data = objectHelper.clone(users.data.u2);
            data.userName = users.data.u1.userName;
            let error: Error;
            try {
                new User(data).save(_);
            } catch (e) {
                error = e;
            } finally {
                expect(error).to.not.null;
                expect(error.toString()).to.equal("ValidationError: Error, expected `userName` to be unique. Value: `user1`");
            }
        });

        it('save user instance forgetting required and immutable value should not work', (_) => {
            let data = objectHelper.clone(users.data.u2);
            delete data.userName;
            let error: Error;
            try {
                new User(data).save(_);
            } catch (e) {
                error = e;
            } finally {
                expect(error).to.not.null;
                expect(error.toString()).to.equal("ValidationError: Path `userName` is required.");
            }
        });

        it('update user instance using existing _id and valid values should work', (_) => {
            let data = objectHelper.clone(users.data.u2);
            data._id = userIds[0];
            data.firstName = "u1_firstname_updated";
            let u1: User = new User(data)
            u1.save(_);
            expect(u1.firstName).to.be.a('string');
            expect(u1.firstName).to.equal(data.firstName);
        });

        it('update user instance with valid values should work', (_) => {
            // use same data, but reuse existing document id in order to use update
            let data = objectHelper.clone(users.data.u1);
            data._id = userIds[0];
            data.lastName = "u1_lastname_updated";
            data.email = "u1@spirit.com";
            data.password = "u1pwd_updated";
            let u1 = new User(data)
            u1.save(_);
            expect(u1.id).to.be.a('object');
            expect(u1.id).to.not.be.null;
            expect(u1.createdAt).to.be.a('date');
            expect(u1.createdAt).to.not.null;
            expect(u1.userName).to.be.a('string');
            expect(u1.userName).to.equal(data.userName);
            expect(u1.firstName).to.be.a('string');
            expect(u1.firstName).to.equal(data.firstName);
            expect(u1.lastName).to.be.a('string');
            expect(u1.lastName).to.equal(data.lastName);
            expect(u1.password).to.be.a('string');
            expect(u1.password).to.equal(data.password);
            expect(u1.email).to.be.a('string');
            expect(u1.email).to.equal(data.email);
        });

        it('update user instance with invalid values should not work', (_) => {
            // use same data, but reuse existing document id in order to use update
            let data = objectHelper.clone(users.data.u1);
            data._id = userIds[0];
            delete data.userName;
            let error: Error;
            try {
                let u1: User = new User(data);
                u1.save(_, { deleteMissing: true });
            } catch (e) {
                error = e;
            } finally {
                expect(error).to.not.null;
                expect(error.toString()).to.equal("ValidationError: Path `userName` is required.");
            }
        });

        it('update user instance changing immutable value should not work', (_) => {
            // use same data, but reuse existing document id in order to use update
            let data = objectHelper.clone(users.data.u1);
            data._id = userIds[0];
            data.userName = "user1_updated";
            let error: Error;
            try {
                let u1: User = new User(data);
                u1.save(_);
            } catch (e) {
                error = e;
            } finally {
                expect(error).to.not.null;
                expect(error.toString()).to.equal("ValidationError: Path `userName` is required.");
            }
        });

        it('delete users should work', (_) => {
            for (let id of userIds) {
                let result = User.remove(_, id).result;
                expect(result.ok).to.equal(1);
                expect(result.n).to.equal(1);
            }


        });
















        // it('create valid user should work', (_) => {
        //         User.remove(_, "57d7b8ef3b161925b0c565a2");
        //         let u1: User = new User({
        //             _id: "57d7b8ef3b161925b0c565a2",
        //             userName: "User1",
        //             firstName: "myName",
        //             lastName: "Chambard",
        //             email: "teddy.chambard@sage.com"
        //         });
        //         u1.save(_);
        //         console.log("U1: ",JSON.stringify(u1));

        //         let u2: User = <User>User.fetchInstance(_,"57d6b1bf2f643b2c7cb2da42");
        //         console.log("U2:",JSON.stringify(u2));
        //         u2.firstName = "Aurelien";
        //         u2.lastName = "Pisu";

        //         console.log(u2.hello());
        //         u2.save(_);

        //         let u3: User = <User>User.fetchInstance(_,"57d6b1bf2f643b2c7cb2da42");
        //         console.log("U3:",JSON.stringify(u3));

        //         let users: User[] = <User[]>User.fetchInstances(_, {lastName:"Chambard"});
        //         console.log("Users: "+JSON.stringify(users,null,2));

        // });

    });
});