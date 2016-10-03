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
        this.collectionName = targetClass._collectionName;
        this.schemaDef = {};
        this.$properties = [];
        this.$plurals = [];
        this.$statics = [];
        this.$methods = [];
        this.$references = {};
    }

}