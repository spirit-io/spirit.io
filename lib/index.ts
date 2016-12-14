import { Server } from './application/server';

module.exports = function (config) {
    return new Server(config);
};