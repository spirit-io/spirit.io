import { collection, unique, required } from '../decorators';
import { ModelBase } from '../base/modelBase';

/**
 * Group class
 */
@collection()
export class Group {
    
    @unique @required
    title: string;

    description: string


}