var lo = require('lodash');

var conf = require('./lib/config.js');

var clear = require('./cache/clear.js');
var stats = require('./cache/stats.js');

var handlers = {
    clear: clear.run,
    stats: stats.run
};

/**
 * Configure the module
 * @param {object} yargs The arguments
 * @returns {undefined}
 */
function config(yargs) {
    'use strict';

    yargs.positional('action', {
        type: 'string',
        describe: 'The cache action to run',
        choices: lo.keys(handlers)
    }).options({});
}

/**
 * The run method
 * @param {object} args The arguments passed to the method
 * @returns {undefined}
 */
function run(args) {
    conf.merge(args);
    conf.checkHandlers(handlers, 'action');

    lo.get(handlers, global.config.action)();
}

var cli = {
    config: config,
    run: run
};

module.exports = cli;