import { _ } from 'streamline-runtime';
import { IModelActions, IModelHelper } from 'spirit.io/lib/interfaces'

export class ModelFactoryBase {

    public targetClass: any;
    public collectionName: string;
    public $properties: string[];
    public $statics: string[];
    public $methods: string[];
    public $fields: string[];
    public $plurals: string[];
    public $references: any;
    public schemaDef: Object;
    public actions: IModelActions;
    public helper: IModelHelper;
    public datasource: string;

    constructor(targetClass: any) {
        this.targetClass = targetClass;
        this.schemaDef = targetClass.__factory__.schemaDef || {};
        this.$properties = targetClass.__factory__.$properties || [];
        this.$plurals = targetClass.__factory__.$plurals || [];
        this.$statics = targetClass.__factory__.$statics || [];
        this.$methods = targetClass.__factory__.$methods || [];
        this.$references = targetClass.__factory__.$references || {};
    }

}