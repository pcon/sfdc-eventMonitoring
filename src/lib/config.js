var ini = require('ini');
var fs = require('fs');
var lo = require('lodash');
var path = require('path');
var Q = require('q');

var SOLENOPSIS_FIELDS = [
    'username',
    'password',
    'token',
    'url'
];

/**
 * Gets the user's home directory
 * @return {string} The user's home directory
 */
function getUserHome() {
    return process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'];
}

/**
 * Load the solenopsis credential file into the global config
 * @param {string} env The environment name to load
 * @returns {undefined}
 */
var loadSolenopsisCredentials = function (env) {
    var solenopsis_config_path = path.join(getUserHome(), '.solenopsis/credentials/', env + '.properties');

    var sol_config = ini.parse(fs.readFileSync(solenopsis_config_path, 'utf-8'));

    lo.merge(global.config, lo.pick(sol_config, SOLENOPSIS_FIELDS));
};

/**
 * Load the config from disk
 * @returns {Promise} A promise for when the config has been loaded
 */
var loadConfig = function () {
    'use strict';

    var deferred = Q.defer();

    fs.readFile(path.join(getUserHome(), '.eventmonitoring'), function (error, data) {
        if (error) {
            if (error.code === 'ENOENT') {
                deferred.resolve();
            } else {
                deferred.reject(error);
            }
        } else {
            lo.merge(global.config, JSON.parse(data));
            deferred.resolve();
        }
    });

    return deferred.promise;
};

/**
 * Merge the global config with a given set of args
 * @param {object} args The args to merge in
 * @returns {undefined}
 */
var merge = function (args) {
    lo.merge(global.config, args);
};

/**
 * Loads the helper methods
 * @returns {Promise} A promise for when the helper method is loaded
 */
function loadHelper() {
    var deferred = Q.defer();

    if (global.config.helper === undefined) {
        global.logger.debug('No helper defined');
        deferred.resolve();
    } else {
        fs.stat(global.config.helper, function (error) {
            if (!error) {
                global.helper = require(global.config.helper); // eslint-disable-line global-require
                global.logger.debug('Loading "' + global.config.helper + '"');
            } else {
                global.logger.debug('Unable to load "' + global.config.helper + '" (' + error.code + ')');
            }

            deferred.resolve();
        });
    }

    return deferred.promise;
}

/**
 * Sets up any additional global variables we need
 * @returns {Promise} A promise for when the setup is complete
 */
var setupGlobals = function () {
    var deferred = Q.defer();
    var promises = [];

    promises.push(loadHelper());

    Q.allSettled(promises)
        .then(function () {
            deferred.resolve();
        });

    return deferred.promise;
};

var config = {
    loadSolenopsisCredentials: loadSolenopsisCredentials,
    loadConfig: loadConfig,
    merge: merge,
    setupGlobals: setupGlobals
};

module.exports = config;