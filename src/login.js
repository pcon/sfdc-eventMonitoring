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
        asc: statics.CONFIG.asc,
        format: statics.CONFIG.format,
        interval: statics.CONFIG.interval,
        latest: statics.CONFIG.latest,
        limit: statics.CONFIG.limit,
        maxversion: statics.CONFIG.maxversion,
        sort: statics.CONFIG.sort,
        summary: statics.CONFIG.summary
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