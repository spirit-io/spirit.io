import express = require("express");

export interface IWrite<T> {
    // create: (item: T, callback: (error: any, result: any ) => void) => void;
    // update:(_id: string, item: T, callback: (error: any, result: any)=> void) => void ;
    // delete: (_id: string, callback: (error: any, result: any) => void) => void;
    
}

export interface WriteController {
    // create: express.RequestHandler;
    // update: express.RequestHandler;
    // delete: express.RequestHandler;
    
}