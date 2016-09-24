import { collection, unique, required } from '../decorators';
import { ModelBase } from '../base/modelBase';

/**
 * User class
 */
@collection({
    name: "role"
})
export class Role {
    
    @unique @required
    title: string;

    description: string


}