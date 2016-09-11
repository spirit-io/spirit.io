import express = require("express");
import mongoose = require("mongoose");
import { _ } from 'streamline-runtime';

export interface IRead<T> {
    find: (_:_, model: mongoose.Model<mongoose.Document>, filter: any) => void ;
    // findById: (_id: string, _:_) => void;    
       
}
export interface ReadController {
    find: express.RequestHandler;
    // findById: express.RequestHandler;
    
    
}