var conf = require('./lib/config.js');
var sfdc = require('./lib/sfdc.js');
var userdump = require('./utils/userdump.js');

var handlers = {userdump: userdump.run};

/**
 * Configure the module
 * @param {object} yargs The arguments
 * @returns {undefined}
 */
function config(yargs) {
    'use strict';

    var pdata = conf.yargs.generatePdata('action', 'The cache action to run', handlers);
    conf.yargs.config(yargs, pdata, {});
}

/**
 * The run method
 * @param {object} args The arguments passed to the method
 * @returns {undefined}
 */
function run(args) {
    conf.merge(args);
    conf.setupLogger();
    conf.loginAndRunHandler(args, handlers, sfdc.login);
}

var cli = {
    config: config,
    run: run
};

module.exports = cli;