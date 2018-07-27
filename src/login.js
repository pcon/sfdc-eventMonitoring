var lo = require('lodash');

var conf = require('./lib/config.js');
var sfdc = require('./lib/sfdc.js');
var statics = require('./lib/statics.js');

var apiversion = require('./login/apiversion.js');
var failed = require('./login/failed.js');

var handlers = {
    apiversion: apiversion.run,
    failed: failed.run
};

/**
 * Configure the module
 * @param {object} yargs The arguments
 * @returns {undefined}
 */
function config(yargs) {
    'use strict';

    yargs.positional('type', {
        type: 'string',
        describe: 'The type of login to run',
        choices: lo.keys(handlers)
    }).options({
        'format': {
            default: 'table',
            describe: 'The format to output',
            type: 'string',
            choices: [ 'json', 'table' ]
        },
        'interval': {
            default: 'hourly',
            describe: 'The interval to use',
            type: 'string',
            choices: [ 'hourly', 'daily' ]
        },
        'latest': statics.CONFIG.latest,
        'asc': statics.CONFIG.asc,
        'sort': statics.CONFIG.sort,
        'limit': statics.CONFIG.limit,
        'maxversion': statics.CONFIG.maxversion,
        'summary': statics.CONFIG.summary
    });
}

/**
 * The run method
 * @param {object} args The arguments passed to the method
 * @returns {undefined}
 */
function run(args) {
    conf.loginAndRunHandler(args, handlers, sfdc.login);
}

var cli = {
    config: config,
    run: run
};

module.exports = cli;