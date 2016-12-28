import * as helpers from './helpers';

/**
 * Method decorator that allows to register a hook on the model factory.
 * @param string The hook's name.
 */
export function hook(name: string): any {
    return function (target: Symbol, propertyKey: string): any {
        helpers.addHook(target, propertyKey, name);
    }
}

/**
 * Method decorator that allows to register a special express route on the model factory.
 * @param string The HTTP method required to call this route.
 * @param string The sub url of the route
 */
export function route(method: string, path: string): any {
    return function (target: Symbol, propertyKey: string): any {
        helpers.addRoute(target, propertyKey, method, path);
    }
}