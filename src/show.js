var conf = require('./lib/config.js');
var sfdc = require('./lib/sfdc.js');

var apiusage = require('./show/apiusage.js');
var logins = require('./show/logins.js');

var handlers = {
    apiusage: apiusage.run,
    logins: logins.run
};

var OPTIONS = conf.yargs.generateOptions([
    'api',
    'asc',
    'format',
    'limit',
    'sort',
    'sublimit',
    'subsort',
    'summary',
    'userid'
]);

/**
 * Configure the module
 * @param {object} yargs The arguments
 * @returns {undefined}
 */
function config(yargs) {
    'use strict';

    var pdata = conf.yargs.generateTypePdata('Show your users that are doing stuff', handlers);
    conf.yargs.config(yargs, pdata, OPTIONS);
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