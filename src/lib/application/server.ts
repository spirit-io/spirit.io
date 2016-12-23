import { Application } from 'express';
import { SchemaCompiler, Middleware } from "../core";
import { Contract } from "./contract";
import { IConnector } from '../interfaces';
import { ConnectorHelper } from '../core';
import { EventEmitter } from 'events';
import * as express from 'express';

// function patchExpress(app) {
//     let _handle = app.handle.bind(app);

//     function logerror(err) {
//         /* istanbul ignore next */
//         if (this.get('env') !== 'test') console.error(err.stack || err.toString());
//     }

//     app.handle = function (req, res, cb) {
//         var done = cb || require('finalhandler')(req, res, {
//             env: this.get('env'),
//             onerror: logerror.bind(app)
//         });
//         run(() => _handle(req, res, cb)).then(() => { done(); }).catch(e => { console.log("ERROROROR:", e.stack); done(e) });
//     }

// }


// function patchRouter(router) {
//     function restore(fn, ...obj) {
//         var props = new Array(arguments.length - 2);
//         var vals = new Array(arguments.length - 2);

//         for (var i = 0; i < props.length; i++) {
//             props[i] = arguments[i + 2];
//             vals[i] = obj[props[i]];
//         }

//         return function (err) {
//             // restore vals
//             for (var i = 0; i < props.length; i++) {
//                 obj[props[i]] = vals[i];
//             }

//             return fn.apply(this, arguments);
//         };
//     }

//     let _handle = router.handle.bind(router);
//     router.handle = function (req, res, out) {
//         var done = restore(out, req, 'baseUrl', 'next', 'params');
//         run(() => _handle(req, res, out)).catch(e => { console.log("ERROROROR:", e.stack); done(e) });
//     }
// }

/**
 * Create a spirit.io server.
 * This is main entry point of the application.
 */
export class Server extends EventEmitter {
    /** The config object */
    public config: any;
    /** The express application */
    public app: Application;
    /** The server's middleware */
    public middleware: Middleware;
    /** The server's contract */
    public contract: Contract;

    /**
     * A config object must be passed in the constructor.
     * See config file documentation.
     */
    constructor(config: any = {}) {
        super();
        this.config = config;
        this.contract = new Contract(this.config);
    }

    /**
     * Initialize the express application and the middleware rules.
     * All the models registered in the contract would be compiled during this phase.
     * An event `initialized` will be emitted when the server would be ready to be started.
     */
    init() {
        this.app = express();
        let router = express.Router();

        // TODO later: patch express to handle transparently f-promise
        // patchExpress(this.app);
        // patchRouter(router)
        this.middleware = new Middleware(this, router);


        // register models
        this.contract.init();
        SchemaCompiler.registerModels(this.middleware.routers, this.contract);
        this.emit('initialized');

        return this;
    }

    /**
     * Configure the main middleware rules.
     * It will also set all the API routes for every registered models.
     * And finally starts the HTTP server regarding the HTTP config elements.
     */
    start(port: number) {
        // configure middleware standard rules
        this.middleware.configure();
        // initialize versioned api routes
        this.middleware.setApiRoutes();
        // set default error handler
        this.middleware.setErrorHandler();

        // start http server
        this.app.listen(port, () => {
            console.log(`Server listening on port ${port}!`);
            this.emit('started');
        });
    }

    /**
     * Allows the register spirit.io connectors.
     */
    addConnector(connector: IConnector): void {
        ConnectorHelper.setConnector(connector);
    }
}