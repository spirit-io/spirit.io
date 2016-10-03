import { collection, unique, required, reverse } from '../decorators';
import { ModelBase } from '../base/modelBase';
import { User } from './';

/**
 * Group class
 */
@collection()
export class Group {
    
    @unique @required
    title: string;

    description: string

    @reverse('groups')
    users: User[]

}