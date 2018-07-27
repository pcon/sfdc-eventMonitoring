var lo = require('lodash');

var conf = require('./lib/config.js');
var sfdc = require('./lib/sfdc.js');
var statics = require('./lib/statics.js');

var apiusage = require('./blame/apiusage.js');

var handlers = { apiusage: apiusage.run };

/**
 * Configure the module
 * @param {object} yargs The arguments
 * @returns {undefined}
 */
function config(yargs) {
    'use strict';

    yargs.positional('type', {
        type: 'string',
        describe: 'Blame your users that are doing stuff',
        choices: lo.keys(handlers)
    }).options({
        'format': {
            default: 'table',
            describe: 'The format to output',
            type: 'string',
            choices: [ 'json', 'table' ]
        },
        'asc': statics.CONFIG.asc,
        'sort': statics.CONFIG.sort,
        'limit': statics.CONFIG.limit,
        'subsort': {
            default: 'count',
            describe: 'The sub-field to sort by.  Use a comma seperated list to sort by multiple fields',
            type: 'string'
        },
        'sublimit': {
            describe: 'The number of results to sub-limit to',
            type: 'number'
        },
        'summary': statics.CONFIG.summary,
        'userid': {
            describe: 'A user id to filter the results by',
            type: 'string'
        }
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