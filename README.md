# spirit.io

spirit.io is an extensible Node.JS ORM framework written with Typescript.  
Its goal is to simplify complex application development by writing simple decorated model classes.  
This classes will be translated by decorators and schemas compiler analysis in order to produce models schemas that would be used by spirit.io connectors...  
At the end, the framework will produce CRUD operations usable from server side using all the power of Typescript language, but also from front-end applications a REST API with Express routes will be automatically generated.  


## Getting Started

First of all, spirit.io is a framework, so you need to create your own project to be able to use it.  
Then, it's important to understand that spirit.io uses [f-promise](https://github.com/Sage/f-promise) API, so please take a look to its documentation to learn all the benefits you will encounter.  

When using `spirit.io` with `Typescript`, the Typescript compilation is done by common typescript compiler `tsc`.  
But the first entry point is that you need to create a standard Javascript file.  

`index.js`:  

```js
"use strict";
const fpromise = require('f-promise');

let MyApp = require('./lib/app').MyApp;
let app = new MyApp().init();
app.on('initialized', () => {
    fpromise.run(() => {
        app.start();
    }).catch(err => {
        console.error(err.stack);
    });
});
```

`app.ts`:  

```ts
import { Server } from 'spirit.io/lib/application';
import { MongodbConnector } from 'spirit.io-mongodb-connector/lib/connector';
import { run } from 'f-promise';

export class MyApp extends Server {
    constructor(config?: any) {
        if (!config) config = require('./config').config;
        super(config);
    }

    init() {
        run(() => {
            console.log("\n========== Initialize server begins ============");
            
            // create a connector. Here mongodb for instance
            let mongoConnector = new MongodbConnector(this.config.connectors.mongodb);
            this.addConnector(mongoConnector);
            console.log("Mongo connector config: " + JSON.stringify(mongoConnector.config, null, 2));
            
            // register your own models
            this.contract.registerModelsByPath(path.resolve(path.join(__dirname, './models')));

            // load models
            super.init();
            this.on('initialized', () => {
                // Do your stuff here !!!
                console.log("========== Server initialized ============\n");
            });

        }).catch(err => {
            console.error(err.stack);
        })

        return this;
    }

    start(port?: number) {
        super.start(port || this.config.expressPort);
    }
}
```


### Prerequisities

To use spirit.io, you need :  
  * Node.JS 6.X
  * At least one spirit.io connector. eg: spirit.io-mongodb-connector
  * The connectors associated runtimes. eg: MongoDB server

### Installing

Installing spirit.io is simple as :  

```sh
# to install the framework
npm install --save spirit.io
# to install connectors
npm install --save spirit.io-mongodb-connector
...
```

## Running the tests

```sh
npm test
```

## Authors

  * **Teddy Chambard** 

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
