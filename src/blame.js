var lo = require('lodash');

var conf = require('./lib/config.js');
var errorCodes = require('./lib/errorCodes.js');
var sfdc = require('./lib/sfdc.js');
var statics = require('./lib/statics.js');
var utils = require('./lib/utils.js');

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
    conf.merge(args);

    if (
        !lo.has(handlers, global.config.type) ||
        lo.get(handlers, global.config.type) === undefined
    ) {
        global.logger.error(global.config.type + ' does not have a supported login handler');
        process.exit(errorCodes.UNSUPPORTED_HANDLER);
    }

    sfdc.login()
        .then(function () {
            lo.get(handlers, global.config.type)();
        })
        .catch(utils.logError);
}

var cli = {
    config: config,
    run: run
};

module.exports = cli;