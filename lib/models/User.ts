import { collection, unique, required, immutable } from '../decorators';
import { ModelBase } from '../base/modelBase';

/**
 * User class
 */
@collection("User")
export class User extends ModelBase {
    
    @unique @required @immutable
    userName: String;
    
    @required
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
