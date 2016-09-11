"use sctrict";
import { Contract } from "../contract";

// need require for mongoose
import { Connection, Schema, Model } from 'mongoose';
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

export class DataAccess {
    static mongooseInstance: any;
    static mongooseConnection: Connection;

    public static connect (): Connection {
        if(this.mongooseInstance) return this.mongooseInstance;
        
        this.mongooseConnection  = mongoose.connection;
        this.mongooseConnection.once("open", () => {
            console.log("Connected on mongodb: "+Contract.DB_CONNECTION);
        });
        
        this.mongooseInstance = mongoose.connect(Contract.DB_CONNECTION);
        return this.mongooseInstance;
    }


}