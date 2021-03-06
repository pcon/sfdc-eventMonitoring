var chalk = require('chalk');
var lo = require('lodash');
var numeral = require('numeral');
var Q = require('q');

const { table } = require('table');

var logging = require('../lib/logging.js');
var queries = require('../lib/queries.js');
var sfdc = require('../lib/sfdc.js');
var statics = require('../lib/statics.js');
var utils = require('../lib/utils.js');

var COLUMNS = [
    'endpoint',
    'count'
];

var OUTPUT_INFO = statics.report.generateOutputInfo(COLUMNS);

var SUMMARY_COLUMNS = [
    '_name',
    '_username',
    '_user_id',
    '_count'
];

var SUMMARY_OUTPUT_INFO = statics.report.generateOutputInfo(SUMMARY_COLUMNS);

/**
 * Generate the name to display
 * @param {object} log The log
 * @returns {string} The name
 */
function generateName(log) {
    if (log.EVENT_TYPE === 'RestApi') {
        return log.URI;
    }

    if (log.EVENT_TYPE === 'API') {
        return log.METHOD_NAME + '.' + log.ENTITY_NAME;
    }

    return log.CLASS_NAME + '.' + log.METHOD_NAME;
}

/**
 * Generate the user id
 * @param {object} log The log
 * @returns {string} The user id
 */
function generateUserId(log) {
    return log.USER_ID;
}

/**
 * Does the initial grouping of log data
 * @param {object[]} logs The logs
 * @param {object} grouping The grouping
 * @returns {undefined}
 */
function levelOneGrouping(logs, grouping) {
    lo.forEach(logs, function (log) {
        var name = generateName(log);
        var user_id = generateUserId(log);

        if (!lo.has(grouping, user_id)) {
            grouping[user_id] = {
                _counts: [],
                _user_id: user_id
            };
        }

        if (!lo.has(grouping[user_id], name)) {
            grouping[user_id][name] = [];
        }

        grouping[user_id][name].push(log);
    });
}

/**
 * Gets a total count for each endpoint
 * @param {object} grouping The grouping
 * @returns {undefined}
 */
function levelTwoGrouping(grouping) {
    lo.forEach(grouping, function (endpoint, user_id) {
        lo.forEach(endpoint, function (logs, name) {
            if (lo.startsWith(name, '_')) {
                return;
            }

            grouping[user_id]._counts.push({
                endpoint: name,
                count: lo.size(logs)
            });
        });
    });
}

/**
 * Groups logs by user id then by endpoint name
 * @param {array} logs The logs
 * @return {Promise} A promise for data grouped by user id then by endpoint
 */
var groupByUserIdAndName = function (logs) {
    var grouping = {};
    var deferred = Q.defer();

    levelOneGrouping(logs, grouping);
    levelTwoGrouping(grouping);

    deferred.resolve(grouping);

    return deferred.promise;
};

/**
 * Fetches the username for all the user ids
 * @param {object} data A mapping of user id to data
 * @returns {object} An object with the original data in 'grouping' and a map of user id to user in 'user_map'
 */
var fetchUsernames = function (data) {
    var results = { grouping: data };
    var deferred = Q.defer();

    sfdc.query(queries.general.users(lo.keys(data)))
        .then(function (users) {
            results.user_map = utils.idToObject(users);
            deferred.resolve(results);
        }).catch(function (error) {
            deferred.reject(error);
        });

    return deferred.promise;
};

/**
 * Enrich the counts with the user info an raw accounts
 * @param {object} data The data
 * @returns {Promise} A promise for th updated data grouping
 */
var enrichCounts = function (data) {
    var name, username, count;
    var deferred = Q.defer();

    lo.forEach(data.grouping, function (user_data, user_id) {
        count = 0;
        lo.forEach(user_data._counts, function (endpoint) {
            count += endpoint.count;
        });

        name = 'Unknown';
        username = 'Unknown';

        if (lo.has(data.user_map, user_id)) {
            name = data.user_map[user_id].Name;
            username = data.user_map[user_id].Username;
        }

        lo.set(data.grouping, [ user_id, '_name' ], name);
        lo.set(data.grouping, [ user_id, '_username' ], username);
        lo.set(data.grouping, [ user_id, '_user_id' ], user_id);
        lo.set(data.grouping, [ user_id, '_count' ], count);
    });

    deferred.resolve(data);

    return deferred.promise;
};

/**
 * Filter the counts down
 * @param {object} data The data
 * @return {Promis} A promise with filtered data
 */
var filterCounts = function (data) {
    var filter = { '_user_id': global.config.userid };

    return utils.filterResults(data, 'grouping', filter);
};

/**
 * Sort counts
 * @param {object} data The data
 * @return {Promise} A promise with sorted data
 */
var sortCounts = function (data) {
    global.config.sort = '_' + global.config.sort;
    return utils.sortResults(data, 'grouping');
};

/**
 * Limit counts
 * @param {object} data The data
 * @return {Promise} A promise with limited data
 */
var limitCounts = function (data) {
    return utils.limitResults(data, 'grouping');
};

/**
 * Act on a grouping
 * @param {object} data The data
 * @param {string} option The option
 * @param {function} func The function to apply to that grouping
 * @return {undefined}
 */
var actOnGrouping = function (data, option, func) {
    var deferred = Q.defer();

    lo.forEach(data.grouping, function (group) {
        func(group, '_counts', option);
    });

    deferred.resolve(data);
    return deferred.promise;
};

/**
 * Sort the second level counts
 * @param {object} data The data
 * @return {Promise} A promise with sorted data
 */
var subSortCounts = function (data) {
    return actOnGrouping(data, global.config.subsort, utils.sortNoPromise);
};

/**
 * Limit the second level counts
 * @param {object} data The data
 * @return {Promise} A promise with limited data
 */
var subLimitCounts = function (data) {
    return actOnGrouping(data, global.config.sublimit, utils.limitNoPromise);
};

/**
 * Get the group info header
 * @param {object} group The group
 * @return {string} The group info header
 */
function formatGroupInfo(group) {
    var output = chalk.bold('User: ') + group._name + ' - ' + group._username + ' - ' + group._user_id + '\n';
    output += chalk.bold('Total API Calls: ') + numeral(group._count).format('0,0');

    return output;
}

/**
 * Get a table of endpoint data
 * @param {object} group The group
 * @return {string} The formatted endpoint data
 */
function formatEndpointData(group) {
    return table(utils.generateTableData(group._counts, COLUMNS, OUTPUT_INFO));
}

/**
 * Prints the data out based on the format
 * @param {object} data The data to print
 * @returns {Promise} A promise for when the printing is done
 */
var printCounts = function (data) {
    var deferred = Q.defer();

    if (global.config.format === 'json') {
        global.printer.print(JSON.stringify(data.grouping));
    } else if (global.config.format === 'table') {
        if (global.config.summary) {
            global.printer.print(table(utils.generateTableData(data.grouping, SUMMARY_COLUMNS, SUMMARY_OUTPUT_INFO)));
        } else {
            lo.forEach(data.grouping, function (group) {
                global.printer.print(formatGroupInfo(group));
                global.printer.print(formatEndpointData(group));
            });
        }
    }

    deferred.resolve();

    return deferred.promise;
};

/**
 * The stuff to run
 * @returns {undefined}
 */
var run = function () {
    'use strict';

    utils.updateUserIdCriteria();

    sfdc.query(queries.show.apiusage())
        .then(utils.fetchAndConvert)
        .then(groupByUserIdAndName)
        .then(fetchUsernames)
        .then(enrichCounts)
        .then(filterCounts)
        .then(sortCounts)
        .then(limitCounts)
        .then(subSortCounts)
        .then(subLimitCounts)
        .then(printCounts)
        .catch(logging.logError);
};

var cli = { run: run };

module.exports = cli;