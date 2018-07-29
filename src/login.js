var conf = require('./lib/config.js');
var sfdc = require('./lib/sfdc.js');

var apiversion = require('./login/apiversion.js');
var failed = require('./login/failed.js');

var handlers = {
    apiversion: apiversion.run,
    failed: failed.run
};

var OPTIONS = conf.yargs.generateOptions([
    'asc',
    'format',
    'interval',
    'latest',
    'limit',
    'maxversion',
    'sort',
    'summary'
]);

/**
 * Configure the module
 * @param {object} yargs The arguments
 * @returns {undefined}
 */
function config(yargs) {
    'use strict';

    var pdata = conf.yargs.generatePdata('type', 'The type of login to run', handlers);

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