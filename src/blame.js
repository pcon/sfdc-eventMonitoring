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
        asc: statics.CONFIG.asc,
        format: statics.CONFIG.format,
        limit: statics.CONFIG.limit,
        sort: statics.CONFIG.sort,
        sublimit: statics.CONFIG.sublimit,
        subsort: statics.CONFIG.subsort,
        summary: statics.CONFIG.summary,
        userid: statics.CONFIG.userid
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