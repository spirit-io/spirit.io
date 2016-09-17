/**
 * @param name string A collection name if you don't want to use the Class name'
 */
export interface ICollection {
    name?: string;
}

/**
 * @param path string space delimited path(s) to populate
 * @param select string optional fields to select
 */
export interface IPopulate {
    path: string;
    select: string;
}

/**
 * @param ref string The name of the related collection
 * @param type anh Should be an ObjectID...
 */
export interface IReference {
    ref: string;
    type?: any;
}



