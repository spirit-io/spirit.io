import { _ } from 'streamline-runtime';
import { collection, unique, required, reverse } from '../decorators';
import { ModelBase } from '../base/modelBase';
import { Role, Group } from './';
/**
 * User class
 */
@collection()
export class User {
    
    @unique @required
    userName: String;
    
    @required
    password: String;
    
    @required
    firstName: String;
    
    lastName: String;
    
    @required
    email: String;

    role: Role

    test: string[];

    @reverse('users')
    groups: Group[]

    get fullName(): String {
        return `${this.firstName} ${this.lastName}`;
    }

    hello(): String {
        return `I said hello to ${this.fullName}`;
    }

    static authenticate(): String {
        let req = _.context['request'];
        let body = req.body;
        return `Authenticate ${body.username} with password ${body.password}`;
    }


}