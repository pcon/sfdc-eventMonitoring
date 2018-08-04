#!/usr/bin/env node

var yargs = require('yargs');
var Q = require('q');

var pkg = require('./package.json');

var config = require('./src/lib/config.js');

var show = require('./src/show.js');
var cache = require('./src/cache.js');
var dump = require('./src/dump.js');
var login = require('./src/login.js');
var report = require('./src/report.js');
var statics = require('./src/lib/statics.js');

global.config = { url: undefined };
global.logger = require('./src/lib/logger.js');

var OPTIONS = {
    env: statics.CONFIG.env,
    username: statics.CONFIG.username,
    password: statics.CONFIG.password,
    token: statics.CONFIG.token,
    sandbox: statics.CONFIG.sandbox,
    solenopsis: statics.CONFIG.solenopsis,
    cache: statics.CONFIG.cache,
    interval: statics.CONFIG.interval,
    latest: statics.CONFIG.latest,
    start: statics.CONFIG.start,
    end: statics.CONFIG.end,
    date: statics.CONFIG.date,
    helper: statics.CONFIG.helper,
    debug: statics.CONFIG.debug
};

var CONFLICTS = {
    env: [ 'username', 'password', 'token' ],
    solenopsis: [ 'username', 'password', 'token' ]
};

/**
 * Runs the script
 * @returns {Promise} A promise for when it's been run
 */
var run = function () {
    var deferred = Q.defer();

    yargs.usage('$0 <cmd> [args]')
        .options(OPTIONS)
        .conflicts(CONFLICTS)
        .version(pkg.version)
        .command('show [type]', 'Show user information', show.config, show.run)
        .command('cache [action]', 'Interact with cache', cache.config, cache.run)
        .command('dump', 'Dump data', dump.config, dump.run)
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