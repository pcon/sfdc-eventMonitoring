var lo = require('lodash');
var Q = require('q');

var login = require('../lib/login.js');
var queries = require('../lib/queries.js');
var sfdc = require('../lib/sfdc.js');
var statics = require('../lib/statics.js');
var utils = require('../lib/utils.js');

var summary = require('./apiversion-summary.js');

var COLUMNS = [
    'version',
    'username',
    'count'
];

var OUTPUT_INFO = statics.report.generateOutputInfo(COLUMNS);

/**
 * Generates a username
 * @param {object} log The log
 * @returns {string} The username
 */
function generateUsername(log) {
    return log.USER_NAME;
}

/**
 * Generates the version
 * @param {object} log The log
 * @returns {number} The version
 */
function generateVersion(log) {
    return parseInt(log.API_VERSION);
}

/**
 * Groups the data by version and then by username
 * @param {array} logs The logs
 * @return {Promise} A promise for the logs grouped by version then username
 */
var groupByVersionAndUsername = function (logs) {
    var version, username;
    var grouping = {};
    var deferred = Q.defer();

    lo.forEach(logs, function (log) {
        version = generateVersion(log);
        username = generateUsername(log);

        if (
            lo.isEmpty(log.API_TYPE) ||
            version >= global.config.maxversion
        ) {
            return;
        }

        if (!lo.has(grouping, version)) {
            grouping[version] = {};
        }

        if (!lo.has(grouping[version], username)) {
            grouping[version][username] = [];
        }

        grouping[version][username].push(log);
    });

    deferred.resolve(grouping);

    return deferred.promise;
};

/**
 * Generates a count of all the pairings
 * @param {array} logs The logs
 * @param {string} version The version
 * @param {string} username The username
 * @return {Promise} A promise for a count of the logs
 */
var generateCountsForVersionAndUsername = function (logs, version, username) {
    var counts = {
        version: parseInt(version),
        username: username,
        count: lo.size(logs)
    };
    var deferred = Q.defer();

    deferred.resolve(counts);

    return deferred.promise;
};

/**
 * Generates a count for all the groupings
 * @param {object} grouping The grouping
 * @returns {Promise} A promise for the grouping with all the counts
 */
var generateCounts = function (grouping) {
    return login.generateCounts(grouping, generateCountsForVersionAndUsername);
};

/**
 * Print the counts out based on the format
 * @param {object} data The data
 * @returns {Promise} A promise for when the print has finished
 */
var printCounts = function (data) {
    return utils.printFormattedData(data.counts, COLUMNS, OUTPUT_INFO);
};

/**
 * The stuff to run
 * @returns {undefined}
 */
var run = function () {
    'use strict';

    if (global.config.summary) {
        summary.run();
    } else {
        sfdc.query(queries.login())
            .then(utils.fetchAndConvert)
            .then(groupByVersionAndUsername)
            .then(generateCounts)
            .then(login.sortCounts)
            .then(login.limitCounts)
            .then(printCounts)
            .catch(function (error) {
                global.logger.error(error);
            });
    }
};

var cli = { run: run };

module.exports = cli;