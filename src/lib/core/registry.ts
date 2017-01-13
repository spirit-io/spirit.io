import { IModelFactory, IValidator } from '../interfaces';
import { Router } from 'express';

export class Registry {
    static factories: Map<string, IModelFactory> = new Map();
    static apiRouters: Map<string, Router> = new Map();
    static validators: Map<string, IValidator> = new Map();

    /**
     * Allows to register a model's factory. The model's name used as identifier is automatically retrieved from the class itself.
     * @param Class The class wanted to be registered by the framework.
     */
    public static setFactory(modelFactory: IModelFactory): void {
        this.factories.set(modelFactory.linkedFactory || modelFactory.collectionName, modelFactory);
    }
    /**
     * Allows to retrieve a model's factory giving a class itself or simply its name.
     * @param Class | string Can be the class itself or its name.
     * @return The model factory asked.
     */
    public static getFactory(target: any): IModelFactory {
        if (typeof target === 'string') {
            return this.factories.get(target);
        }
        let collectionName = target._collectionName;
        return this.factories.get(collectionName);
    }

    /**
     * Allows to register an express router.
     * @param string The API router key. The route declared would be /api/:key
     * @param Router The express Router. Usually created with `express.Router()`
     */
    public static setApiRouter(key: string, router: Router) {
        this.apiRouters.set(key, router);
    }


    /**
     * Allows to retrieve an API router giving a key.
     * @param string The router identifier.
     * @return Router The express router asked.
     */
    public static getApiRouter(key: string): Router {
        return this.apiRouters.get(key);
    }


    public static registerValidator(validator: IValidator) {
        if (!this.validators.has(validator.name)) this.validators.set(validator.name, validator);
    }

    public static getValidator(key: string): IValidator {
        return this.validators.get(key);
    }


}