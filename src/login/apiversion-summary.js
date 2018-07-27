var lo = require('lodash');
var Q = require('q');

var login = require('../lib/login.js');
var queries = require('../lib/queries.js');
var qutils = require('../lib/qutils.js');
var statics = require('../lib/statics.js');
var utils = require('../lib/utils.js');

var COLUMNS = [
    'version',
    'count'
];

var OUTPUT_INFO = statics.report.generateOutputInfo(COLUMNS);

/**
 * Generates the version
 * @param {object} log The log
 * @returns {string} The version
 */
function generateVersion(log) {
    return parseInt(log.API_VERSION);
}

/**
 * Groups the data by the version
 * @param {array} logs The Logs
 * @return {Promise} A promise for the logs grouped by version
 */
var groupByVersion = function (logs) {
    var deferred = Q.defer();
    var version;
    var grouping = {};

    lo.forEach(logs, function (log) {
        version = generateVersion(log);

        if (
            lo.isEmpty(log.API_TYPE) ||
            version >= global.config.maxversion
        ) {
            return;
        }

        if (!lo.has(grouping, version)) {
            grouping[version] = [];
        }

        grouping[version].push(log);
    });

    deferred.resolve(grouping);

    return deferred.promise;
};

/**
 * Generates the counts for a single version
 * @param {array} logs The logs
 * @param {string} version The version
 * @return {promise} A promise for a count for the version
 */
var generateCountsForVersion = function (logs, version) {
    var deferred = Q.defer();
    var counts = {
        version: parseInt(version),
        count: lo.size(logs)
    };

    deferred.resolve(counts);

    return deferred.promise;
};

/**
 * Generate the counts for every version
 * @param {object} grouping The grouping of version
 * @returns {Promise} A promise for all the counts for all the groupings
 */
var generateCounts = function (grouping) {
    var deferred = Q.defer();
    var promises = [];

    lo.forEach(grouping, function (logs, version) {
        promises.push(generateCountsForVersion(logs, version));
    });

    qutils.allSettledPushValue(deferred, promises, grouping, 'counts');

    return deferred.promise;
};

/**
 * Prints the counts based on the format
 * @param {object} data The data
 * @returns {Promise} A promise for when the data has been printed
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

    login.run({
        query: queries.login(),
        groupBy: groupByVersion,
        generateCounts: generateCounts,
        printCounts: printCounts
    });
};

var cli = { run: run };

module.exports = cli;