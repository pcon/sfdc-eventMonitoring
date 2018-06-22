var lo = require('lodash');
var Q = require('q');

var conf = require('./lib/config.js');
var errorCodes = require('./lib/errorCodes.js');
var sfdc = require('./lib/sfdc.js');
var visualforce = require('./report-visualforce.js');

var handlers = {
    apexsoap: undefined,
    visualforce: visualforce.run
}

function config(yargs) {
    'use strict';

    yargs.positional('type', {
        type: 'string',
        describe: 'The type of report to run',
        choices: [
            'visualforce'
        ]
    }).options({
        'format': {
            default: 'table',
            describe: 'The format to output',
            type: 'string',
            choices: ['json', 'table']
        },
        'interval': {
            default: 'hourly',
            describe: 'The interval to use',
            type: 'string',
            choices: ['hourly', 'daily']
        },
        'latest': {
            default: true,
            describe: 'Use the most recent data',
            type: 'boolean',
            hidden: true
        },
        'asc': {
            default: false,
            describe: 'Sort the data in ascending order',
            type: 'boolean'
        },
        'sort': {
            default: 'count',
            describe: 'The field to sort by.  Use a comma seperated list to sort by multiple fields',
            type: 'string'
        },
        'limit': {
            describe: 'The number of results to limit to',
            type: 'number'
        }
    });
}

function run(args) {
    conf.merge(args);

    if (
        !lo.has(handlers, global.config.type) ||
        lo.get(handlers, global.config.type) === undefined
    ) {
        global.logger.error(global.config.type + ' does not have a supported report handler');
        process.exit(errorCodes.UNSUPPORTED_HANDLER);
    }

    sfdc.login()
        .then(function () {
            lo.get(handlers, global.config.type)();
        });
}

var cli = {
    config: config,
    run: run
};

module.exports = cli;