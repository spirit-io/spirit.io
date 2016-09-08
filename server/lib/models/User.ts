import mongoose = require("mongoose");
import { collection } from '../core/decorators';


export interface IUser extends mongoose.Document {
  name: string;
}

/**
 * User class
 */
@collection()
export class User{
    

    firstName: String;
    lastName: String;

    get fullName(): String {
        return `${this.firstName} ${this.lastName}`;
    }

    hello(): String {
        return `Hello ${this.fullName}`;
    }


}
Object.seal(User);
