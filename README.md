This project is currently in development...

# spirit.io

spirit.io is an extensible Node.JS ORM framework written with Typescript.  
Its goal is to simplify complex application development by writing simple decorated model classes.  
This classes will be translated by decorators and schemas compiler analysis in order to produce models schemas that would be used by spirit.io connectors...  
At the end, the framework will produce CRUD operations usable from server side using all the power of Typescript language, but also from front-end applications a REST API with Express routes will be automatically generated.  


## Getting Started

First of all, spirit.io is a framework, so you need to create your own project to be able to use it.  
Then, it's important to understand that spirit.io uses `streamline` generators, so please take a look to streamline documentation to learn all the benefits you will encounter.  

When using `streamline` with `Typescript`, the Typescript compilation is not done by common typescript compiler like `tsc`.  
Streamline does its own compilation of .ts files at application startup.  
That means you don't have to build your application, it's ready to be used directly by executing `node .` command in your project.  
But the first entry point is that you need to create a standard Javascript file.  

`index.js`:  

```js
"use strict";

require("streamline").register({}); // necessary to use streamline
require ('streamline-runtime'); // necessary to use node executable instead of _node, and also .js extension files instead of ._js

let spirit = require('spirit.io'); // here you require the framework

// then simply create your application wrapper
let App = require('./app'); // app is app.ts file described below
var port = parseInt(process.env.PORT, 10) || 3000;
new App(spirit(port)).init(function(err) {
    if (err) throw err;
});
```

`app.ts`:  

```ts
/// <reference path="node_modules/spirit.io/typings/index.d.ts" />
import { _ } from 'streamline-runtime'; // every ts file with this import will be handled by streamline generator
import { Server } from 'spirit.io/lib/application'; // the spirit.io Server class need to be in your constructor arguments

class App {
    constructor(private server: Server) {}
    init = (_: _) => {
        this.server.start(_); // here we start the express application server
        
        // then you can register your own routes
        this.server.app.use('/test' , (req, res, cb) => {
            res.send('It works !');
        });
    }
}

module.exports = App; // Do not forget to export your class as module to let him being visible from index.js file
```


### Prerequisities

To use spirit.io, you need :
* Node.JS 4.X
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
node node_modules/spirit.io/test
```

## Authors

* **Teddy Chambard** 

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
