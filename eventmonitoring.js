#!/usr/bin/env node

var Q = require('q');

var config = require('./src/lib/config.js');
var pkg = require('./package.json');
var report = require('./src/report.js');

global.config = {
    url: undefined
};

global.logger = require('./src/lib/logger.js');

var run = function () {
    var deferred = Q.defer();

    require('yargs')
        .usage('$0 <cmd> [args]')
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
            'env': ['username', 'password', 'token'],
            'solenopsis': ['username', 'password', 'token']
        })
        .version(pkg.version)
        .command('report [type]', 'Display a report', report.config, report.run)
        .argv;

    deferred.resolve();

    return deferred.promise;
}

config.loadConfig()
    .then(run)
    .catch(function (error) {
        global.logger.error(error);
    });