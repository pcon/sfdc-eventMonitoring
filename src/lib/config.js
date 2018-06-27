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

var config = {
    loadSolenopsisCredentials: loadSolenopsisCredentials,
    loadConfig: loadConfig,
    merge: merge
};

module.exports = config;