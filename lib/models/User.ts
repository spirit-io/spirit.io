import { collection, unique, required } from '../decorators';
import { ModelBase } from '../base/modelBase';

/**
 * User class
 */
@collection("User")
export class User extends Model {
    
    @unique @required
    userName: String;
    
    password: String;
    
    @required
    firstName: String;
    
    lastName: String;
    
    @required
    email: String;



    get fullName(): String {
        return `${this.firstName} ${this.lastName}`;
    }

    hello(): String {
        return `Hello ${this.fullName}`;
    }


}
//Object.seal(User);
