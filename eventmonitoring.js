#!/usr/bin/env node

var yargs = require('yargs');
var Q = require('q');

var pkg = require('./package.json');

var config = require('./src/lib/config.js');

var blame = require('./src/blame.js');
var login = require('./src/login.js');
var report = require('./src/report.js');

global.config = { url: undefined };
global.logger = require('./src/lib/logger.js');

/**
 * Runs the script
 * @returns {Promise} A promise for when it's been run
 */
var run = function () {
    var deferred = Q.defer();

    yargs.usage('$0 <cmd> [args]')
        .options({
            'env': {
                alias: 'e',
                describe: 'The envirionment name',
                type: 'string'
            },
            'username': {
                alias: 'u',
                describe: 'The Salesforce username',
                type: 'string'
            },
            'password': {
                alias: 'p',
                describe: 'The Salesforce password',
                type: 'string'
            },
            'token': {
                alias: 't',
                describe: 'The Salesforce token',
                type: 'string'
            },
            'sandbox': {
                describe: 'The Salesforce instance is a sandbox',
                type: 'boolean'
            },
            'solenopsis': {
                describe: 'User solenopsis configs for environments',
                type: 'boolean',
                default: undefined
            },
            'debug': {
                alias: 'd',
                describe: 'Enable debug logging',
                type: 'boolean'
            }
        })
        .conflicts({
            'env': [ 'username', 'password', 'token' ],
            'solenopsis': [ 'username', 'password', 'token' ]
        })
        .version(pkg.version)
        .command('blame [type]', 'Blame users', blame.config, blame.run)
        .command('login [type]', 'Login information', login.config, login.run)
        .command('report [type]', 'Display a report', report.config, report.run)
        .argv;

    deferred.resolve();

    return deferred.promise;
};

config.loadConfig()
    .then(run)
    .catch(function (error) {
        global.logger.error(error);
    });