import express = require("express");
import { _ } from 'streamline-runtime';

export interface IRead<T> {
    retrieve: (_:_) => void ;
    // findById: (_id: string, _:_) => void;    
       
}
export interface ReadController {
    retrieve: express.RequestHandler;
    // findById: express.RequestHandler;
    
    
}