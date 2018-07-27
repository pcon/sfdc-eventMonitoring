var ini = require('ini');
var fs = require('fs');
var lo = require('lodash');
var moment = require('moment');
var path = require('path');
var process = require('process');
var Q = require('q');

var errorCodes = require('./errorCodes.js');
var logging = require('./logging.js');

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

/**
 * Returns if any of the variables passed in are undefined
 * @param {string|string[]} keys The keys to check
 * @return {boolean} If any of the keys are undefined
 */
var isUndefined = function (keys) {
    if (lo.isArray(keys)) {
        lo.forEach(keys, function (key) {
            if (lo.isUndefined(lo.get(global.config, key))) {
                return true;
            }
        });

        return false;
    }

    return lo.isUndefined(lo.get(global.config, keys));
};

/**
 * Checks to see if the requested handler is available
 * @param {object} handlers The available handlers
 * @param {string} handler_key The key in the config to use
 * @returns {undefined}
 */
var checkHandlers = function (handlers, handler_key) {
    var handler_name = lo.isUndefined(handler_key) ? 'type' : handler_key;
    if (
        !lo.has(handlers, lo.get(global.config, handler_name)) ||
        lo.get(handlers, lo.get(global.config, handler_name)) === undefined
    ) {
        logging.logAndExit(global.config.type + ' does not have a supported handler', errorCodes.UNSUPPORTED_HANDLER);
    }
};

/**
 * Logs in and runs the specified handler
 * @param {object} args The arguments passed to the method
 * @param {object} handlers The handlers
 * @param {function} login The login method
 * @returns {undefined}
 */
var loginAndRunHandler = function (args, handlers, login) {
    merge(args);

    checkHandlers(handlers);

    login()
        .then(function () {
            lo.get(handlers, global.config.type)();
        })
        .catch(logging.logError);
};

/**
 * Gets a moment version of the end date
 * @returns {object} The end date
 */
var getEnd = function () {
    var m_end = moment.utc();

    if (!config.isUndefined('end')) {
        m_end = moment.utc(global.config.end);
    }

    if (!config.isUndefined('date')) {
        m_end = moment.utc(global.config.date).endOf('Day');
    }

    return m_end;
};

/**
 * Gets a moment version of the start date
 * @returns {object} The start date
 */
var getStart = function () {
    var m_start = moment.utc(0);

    if (!config.isUndefined('start')) {
        m_start = moment.utc(global.config.start);
    }

    if (!config.isUndefined('date')) {
        m_start = moment.utc(global.config.date).startOf('Day');
    }

    return m_start;
};

/**
 * Do we have dates to act on
 * @returns {boolean} If we have dates
 */
var hasADate = function () {
    return (
        global.config.start !== undefined ||
        global.config.end !== undefined ||
        global.config.date !== undefined
    );
};

var config = {
    checkHandlers: checkHandlers,
    date: {
        getEnd: getEnd,
        getStart: getStart,
        hasADate: hasADate
    },
    isUndefined: isUndefined,
    loadSolenopsisCredentials: loadSolenopsisCredentials,
    loadConfig: loadConfig,
    loginAndRunHandler: loginAndRunHandler,
    merge: merge,
    setupGlobals: setupGlobals
};

module.exports = config;