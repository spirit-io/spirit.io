import { collection, unique, required, ref } from '../decorators';
import { ModelBase } from '../base/modelBase';
import { Role } from './role';
/**
 * User class
 */
@collection("User")
export class User extends ModelBase {
    
    @unique @required
    userName: String;
    
    @required
    password: String;
    
    @required
    firstName: String;
    
    lastName: String;
    
    @required
    email: String;

    @ref('role')
    role: Role

    get fullName(): String {
        return `${this.firstName} ${this.lastName}`;
    }

    hello(): String {
        return `Hello ${this.fullName}`;
    }


}
//Object.seal(User);
