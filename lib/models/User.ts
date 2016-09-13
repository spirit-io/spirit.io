import mongoose = require("mongoose");
import { collection, unique, required } from '../core/decorators';
import { ModelBase } from '../core/ModelBase';
export interface IUser extends mongoose.Document {
  userName: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
}




/**
 * User class
 */
@collection("User")
export class User extends ModelBase {
    
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
