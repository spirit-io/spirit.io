import { IModelFactory, IValidator } from '../interfaces';
import { Router } from 'express';

export class Registry {
    public static factories: Map<string, IModelFactory> = new Map();
    public static enums: Map<string, Object> = new Map();
    public static apiRouters: Map<string, Router> = new Map();
    public static validators: Map<string, IValidator> = new Map();

    /**
     * Allows to register a model's factory. The model's name used as identifier is automatically retrieved from the class itself.
     * @param modelFactory Class The class wanted to be registered by the framework.
     */
    public static setFactory(modelFactory: IModelFactory, override?: boolean): void {
        const factoryName = modelFactory.linkedFactory || modelFactory.collectionName;
        if (!override && this.factories.has(factoryName)) return;
        this.factories.set(factoryName, modelFactory);
    }
    /**
     * Allows to retrieve a model's factory giving a class itself or simply its name.
     * @param target Class | string Can be the class itself or its name.
     * @return The model factory asked.
     */
    public static getFactory(target: any): IModelFactory {
        const factory: IModelFactory | undefined = typeof target === 'string' ?
            this.factories.get(target) : this.factories.get(target._collectionName);
        if (!factory) throw new Error(`Model factory not found: '${target._collectionName || target}'`);
        return factory;
    }

    /**
     * Allows to register an express router.
     * @param key string The API router key. The route declared would be /api/:key
     * @param router Router The express Router. Usually created with `express.Router()`
     */
    public static setApiRouter(key: string, router: Router) {
        this.apiRouters.set(key, router);
    }

    /**
     * Allows to retrieve an API router giving a key.
     * @param key string The router identifier.
     * @return Router The express router asked.
     */
    public static getApiRouter(key: string): Router {
        const router: Router | undefined = this.apiRouters.get(key);
        if (!router) throw new Error(`Router not found: ${key}`);
        return router;
    }

    public static registerValidator(validator: IValidator) {
        if (!this.validators.has(validator.name)) this.validators.set(validator.name, validator);
    }

    public static getValidator(key: string): IValidator {
        const validator = this.validators.get(key);
        // if (!validator) throw new Error(`Validator not found for '${key}'`);
        return validator as IValidator;
    }

    public static registerEnum(name: string, obj: Object) {
        if (!this.enums.has(name)) this.enums.set(name, obj);
    }

    public static getEnum(name: string): Object {
        const _enum =  this.enums.get(name);
        if (!_enum) throw new Error(`Enum not found for '${name}'`);
        return _enum;
    }

}
