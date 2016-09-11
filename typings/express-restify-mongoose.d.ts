declare module 'express-restify-mongoose' {
    import * as mongoose from 'mongoose';
    import * as express from 'express';
    export function serve(app: express.Router, model: mongoose.Model<mongoose.Document>, options?: any): string;
    export function defaults(options: any): void;
}