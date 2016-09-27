import { _ } from 'streamline-runtime';
import { User } from '../../lib/models';
import { helper as objectHelper } from '../../lib/utils/object';
import { AdminHelper } from '../../lib/core/adminHelper';

const expect = require('chai').expect;

const users: any = {
    keys: ['_id', '_createdAt', '_updatedAt', 'userName', 'password', 'firstName', 'lastName', 'email', 'role', 'groups'],
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
let userInstances = [];

let db = AdminHelper.model(User);
/**
 * Unit tests
 */
describe('User Model Unit Tests:', () => {

    describe('CRUD validation', () => {



        it('save user instance with valid values should work', (_) => {

            
            let data = objectHelper.clone(users.data.u1);
            let u1: User = new User();
            db.updateValues(u1, data);
            db.saveInstance(_, u1);
            // store _id to be able to remove all documents at the end
            userInstances.push(u1);

            expect(db.serialize(u1)).to.have.all.keys(users.keys);
           
            let _id = db.getMetadata(u1, '_id');
            let _createdAt = db.getMetadata(u1, '_createdAt');
            
            expect(_id).to.be.a('object');
            expect(_id).to.not.be.null;
            expect(_createdAt).to.be.a('date');
            expect(_createdAt).to.not.null;
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
                let u1 = new User();
                db.updateValues(u1, data);
                db.saveInstance(_, u1);
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
                let u1 = new User();
                db.updateValues(u1, data);
                db.saveInstance(_, u1);
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
                let u1 = new User();
                db.updateValues(u1, data);
                db.saveInstance(_, u1);
            } catch (e) {
                error = e;
            } finally {
                expect(error).to.not.null;
                expect(error.toString()).to.equal("ValidationError: Path `userName` is required.");
            }
        });

        it('update user instance using existing _id and valid values should work', (_) => {
            let data = objectHelper.clone(users.data.u1);
            data._id = userInstances[0]._id;
            data.firstName = "u1_firstname_updated";
            let u1 = new User();
            db.updateValues(u1, data);
            db.saveInstance(_, u1);
            expect(u1.firstName).to.be.a('string');
            expect(u1.firstName).to.equal(data.firstName);
        });

        it('update user instance with valid values should work', (_) => {
            // use same data, but reuse existing document id in order to use update
            let data = objectHelper.clone(users.data.u1);
            data._id = userInstances[0]._id;
            data.lastName = "u1_lastname_updated";
            data.email = "u1@spirit.com";
            data.password = "u1pwd_updated";
            let u1 = new User();
            db.updateValues(u1, data);
            db.saveInstance(_, u1);

            let _id = db.getMetadata(u1, '_id');
            let _createdAt = db.getMetadata(u1, '_createdAt');
            let _updatedAt = db.getMetadata(u1, '_createdAt');

            expect(_id).to.be.a('object');
            expect(_id).to.not.be.null;
            expect(_createdAt).to.be.a('date');
            expect(_createdAt).to.not.null;
            expect(_updatedAt).to.be.a('date');
            expect(_updatedAt).to.not.null;
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
            data._id = userInstances[0]._id;
            delete data.userName;
            let error: Error;
            try {
                let u1 = new User();
                db.updateValues(u1, data);
                db.saveInstance(_, u1, { deleteMissing: true });
            } catch (e) {
                error = e;
            } finally {
                expect(error).to.not.null;
                expect(error.toString()).to.equal("ValidationError: Path `userName` is required.");
            }
        });

        it('save user instance using ModelBase methods should work', (_) => {

            
            let data = objectHelper.clone(users.data.u2);
            let u2: User = new User(data);
            u2.save(_);
            // store _id to be able to remove all documents at the end
            userInstances.push(u2);

            expect(u2.serialize()).to.have.all.keys(users.keys);
            
            expect(u2.id).to.be.a('object');
            expect(u2.id).to.not.be.null;
            expect(u2.createdAt).to.be.a('date');
            expect(u2.createdAt).to.not.null;
            expect(u2.userName).to.be.a('string');
            expect(u2.userName).to.equal(data.userName);
            expect(u2.firstName).to.be.a('string');
            expect(u2.firstName).to.equal(data.firstName);
            expect(u2.lastName).to.be.a('string');
            expect(u2.lastName).to.equal(data.lastName);
            expect(u2.password).to.be.a('string');
            expect(u2.password).to.equal(data.password);
            expect(u2.email).to.be.a('string');
            expect(u2.email).to.equal(data.email);
        });


        it('delete users should work', (_) => {
            let db = AdminHelper.model(User);
            for (let inst of userInstances) {
                let result = db.deleteInstance(_, inst).result;
                expect(result.ok).to.equal(1);
                expect(result.n).to.equal(1);
            }
        });

    });
});