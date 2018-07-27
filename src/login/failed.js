var lo = require('lodash');
var Q = require('q');

var login = require('../lib/login.js');
var statics = require('../lib/statics.js');
var queries = require('../lib/queries.js');
var utils = require('../lib/utils.js');

var COLUMNS = [
    'username',
    'count',
    'message'
];

var OUTPUT_INFO = statics.report.generateOutputInfo(COLUMNS);

/**
 * Generates the name
 * @param {object} log The log
 * @returns {string} The name
 */
function generateName(log) {
    return log.USER_NAME;
}

/**
 * Generates the message key
 * @param {object} log The log
 * @returns {string} The message key
 */
function generateMessageKey(log) {
    return log.LOGIN_STATUS;
}

/**
 * Groups the data by the username and login status
 * @param {array} logs The Logs
 * @return {Promise} A promise for the logs grouped by username and login status
 */
var groupByUsernameAndLoginStatus = function (logs) {
    var name, key;
    var grouping = {};
    var deferred = Q.defer();

    lo.forEach(logs, function (log) {
        name = generateName(log);
        key = generateMessageKey(log);

        if (login.wasSuccessful(key)) {
            return;
        }

        if (!lo.has(grouping, name)) {
            grouping[name] = {};
        }

        if (!lo.has(grouping[name], key)) {
            grouping[name][key] = [];
        }

        grouping[name][key].push(log);
    });

    deferred.resolve(grouping);

    return deferred.promise;
};

/**
 * Generates the averages for a username and message key
 * @param {array} logs The logs
 * @param {string} username The username
 * @param {string} messageKey The message key
 * @return {promise} A promise for an average for the username and message key
 */
var generateCountsForUsernameAndLoginStatus = function (logs, username, messageKey) {
    var deferred = Q.defer();
    var counts = {
        username: username,
        count: lo.size(logs),
        message: messageKey
    };

    deferred.resolve(counts);

    return deferred.promise;
};

/**
 * Generate the count for every username
 * @param {object} grouping The grouping of data
 * @returns {Promise} A promise for all the count for all the groupings
 */
var generateCounts = function (grouping) {
    return login.generateCounts(grouping, generateCountsForUsernameAndLoginStatus);
};

/**
 * Prints the averages based on the format
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
        groupBy: groupByUsernameAndLoginStatus,
        generateCounts: generateCounts,
        printCounts: printCounts
    });
};

var cli = {run: run};

module.exports = cli;