import { collection, unique, required } from '../decorators';
import { ModelBase } from '../base/modelBase';

/**
 * Role class
 */
@collection({
    name: "role"
})
export class Role {
    
    @unique @required
    title: string;

    description: string


}