var chalk = require('chalk');
var lo = require('lodash');
var Q = require('q');

const { table } = require('table');

var config = require('../lib/config.js');
var formatter = require('../lib/formatter.js');
var sfdc = require('../lib/sfdc.js');
var queries = require('../lib/queries.js');
var utils = require('../lib/utils.js');

/**
 * Take the value in the increment string and add one to it
 * @param {object} data The data
 * @param {string} incrementString The string to increment
 * @return {undefined}
 */
var incrementValues = function (data, incrementString) {
    lo.set(data, incrementString, lo.get(data, incrementString) + 1);
};

/**
 * Filters out the users that we don't care about
 * @param {object[]} logs The logs
 * @returns {Promise} A promise for when the logs have been filtered
 */
var filterResults = function (logs) {
    var deferred = Q.defer();
    var results = [];

    if (
        lo.isEmpty(global.config.userid) &&
        !global.config.api
    ) {
        deferred.resolve(logs);
        return deferred.promise;
    }

    lo.forEach(logs, function (log) {
        var include = false;

        if (lo.includes(lo.castArray(global.config.userid), log.USER_ID)) {
            include = true;
        }

        if (
            global.config.api &&
            lo.isEmpty(log.API_TYPE)
        ) {
            include = false;
        }

        if (include) {
            results.push(log);
        }
    });

    deferred.resolve(results);

    return deferred.promise;
};

/**
 * Sets up a new user id record in the data
 * @param {object} data The data
 * @param {object} log The log
 * @return {undefined}
 */
var setupNewUserId = function (data, log) {
    var baseObj = {
        info: {
            userid: log.USER_ID,
            username: log.USER_NAME
        },
        averages: {
            completedSessions: 0,
            sessionLength: 0
        },
        counts: {
            login: 0,
            explicitLogout: 0,
            implicitLogout: 0
        },
        sessions: {}
    };

    lo.set(data, log.USER_ID, baseObj);
};

/**
 * Adds the log to the sessions lookup if it should be
 * @param {object} data The data
 * @param {object} log The log
 * @returns {undefined}
 */
var addToSessions = function (data, log) {
    if (lo.isEmpty(log.REQUEST_ID)) {
        return;
    }

    lo.set(data[log.USER_ID].sessions, log.REQUEST_ID + '.' + lo.upperFirst(log.EVENT_TYPE), log);
};

/**
 * Counts the log under the user
 * @param {object} data The data
 * @param {object} log The log
 * @returns {undefined}
 */
var countLog = function (data, log) {
    var incrementString = log.USER_ID + '.counts.login';

    if (lo.upperFirst(log.EVENT_TYPE) === 'Logout') {
        if (lo.toInteger(log.USER_INITIATED_LOGOUT) === 0) {
            incrementString = log.USER_ID + '.counts.implicitLogout';
        } else {
            incrementString = log.USER_ID + '.counts.explicitLogout';
        }
    }

    incrementValues(data, incrementString);
};

/**
 * Group the data
 * @param {object[]} logs The logs
 * @returns {Promise} A promise for when the data is grouped
 */
var groupData = function (logs) {
    var deferred = Q.defer();
    var data = {};

    lo.forEach(logs, function (log) {
        if (!lo.has(data, log.USER_ID)) {
            setupNewUserId(data, log);
        } else if (lo.isUndefined(lo.get(data, log.USER_ID + '.info.username'))) {
            lo.set(data, log.USER_ID + '.info.username', log.USER_NAME);
        }

        addToSessions(data, log);
        countLog(data, log);
    });

    deferred.resolve(data);

    return deferred.promise;
};

/**
 * Get the session length
 * @param {object} session The session
 * @returns {number} The session length
 */
var getSessionLength = function (session) {
    return utils.toTimestamp(session.Logout.TIMESTAMP_DERIVED) - utils.toTimestamp(session.Login.TIMESTAMP_DERIVED);
};

/**
 * Generates the averages
 * @param {object} data The data
 * @returns {Promise} A promise for when the data has been averaged
 */
var generateAverages = function (data) {
    var deferred = Q.defer();

    lo.forEach(data, function (grouping, user_id) {
        var totalSessionLength = 0;
        var completedSessions = 0;

        lo.forEach(grouping.sessions, function (session) {
            if (
                !lo.has(session, 'Login') ||
                !lo.has(session, 'Logout')
            ) {
                return;
            }

            totalSessionLength += getSessionLength(session);
            completedSessions += 1;
        });

        if (completedSessions > 0) {
            lo.set(data, user_id + '.averages.completedSessions', completedSessions);
            lo.set(data, user_id + '.averages.sessionLength', totalSessionLength / completedSessions);
        }
    });

    deferred.resolve(data);

    return deferred.promise;
};

/**
 * Get the array of data to sort by
 * @param {object} data The data
 * @returns {object[]} The sorted data
 */
var getSortArray = function (data) {
    var results = [];

    lo.forEach(data, function (row, user_id) {
        results.push({
            userid: user_id,
            count: row.counts.login,
            explicit: row.counts.explicitLogout,
            implicit: row.counts.implicitLogout,
            session: row.averages.sessionLength
        });
    });

    results = utils.sortArray(results, global.config.sort);

    if (global.config.asc) {
        results = lo.reverse(results);
    }

    results = utils.limitArray(results, global.config.limit);

    return results;
};

/**
 * Prints the data to the terminal
 * @param {object} data The data
 * @returns {undefined}
 */
var sortAndLimitData = function (data) {
    var deferred = Q.defer();
    var sortArray = getSortArray(data);
    var results = [];

    lo.forEach(sortArray, function (sort) {
        results.push(lo.get(data, sort.userid));
    });

    deferred.resolve(results);

    return deferred.promise;
};

/**
 * Prints out a single entry in a summary
 * @param {object} data The data to print
 * @returns {undefined}
 */
var printSummaryLine = function (data) {
    if (lo.isUndefined(data.info.username)) {
        global.logger.log(chalk.bold('User Id: ') + data.info.userid);
    } else {
        global.logger.log(chalk.bold('Username: ') + data.info.username + ' (' + data.info.userid + ')');
    }
    global.logger.log(chalk.bold('Total Logins: ') + data.counts.login);

    var totalLogouts = data.counts.explicitLogout + data.counts.implicitLogout;
    global.logger.log(
        chalk.bold('Total Logouts: ') + lo.padEnd(totalLogouts, 10) +
        chalk.bold('Explicit: ') + lo.padEnd(data.counts.explicitLogout, 10) +
        chalk.bold('Implicit: ') + data.counts.implicitLogout
    );

    if (data.averages.sessionLength !== 0) {
        global.logger.log(chalk.bold('Average Session Length: ') + formatter.prettyms(data.averages.sessionLength));
    }

    var table_data = [ [
        chalk.bold('URI'),
        chalk.bold('Duration'),
        chalk.bold('Version')
    ] ];

    lo.forEach(data.sessions, function (session) {
        if (
            !lo.has(session, 'Login') ||
            !lo.has(session, 'Logout')
        ) {
            return;
        }

        var sessionLength = getSessionLength(session);
        var apiVersion = session.Login.API_VERSION === '9998.0' ? 'N/A' : session.Login.API_VERSION;
        table_data.push([
            session.Login.URI,
            formatter.prettyms(sessionLength),
            apiVersion
        ]);
    });

    if (lo.size(table_data) > 1) {
        global.logger.log(table(table_data));
    }

    global.logger.log('');
};

/**
 * Print out our data in a summary format
 * @param {object[]} data The data to print
 * @returns {undefined}
 */
var printSummary = function (data) {
    lo.forEach(data, function (row) {
        printSummaryLine(row);
    });
};

/**
 * Prints the data out based on the format
 * @param {object} data The data to print
 * @returns {Promise} A promise for when the printing is done
 */
var printCounts = function (data) {
    var deferred = Q.defer();

    if (config.isJSON()) {
        utils.printJSON(data);
    } else if (config.isTable()) {
        printSummary(data);
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

    sfdc.query(queries.show.logins())
        .then(utils.fetchAndConvert)
        .then(filterResults)
        .then(groupData)
        .then(generateAverages)
        .then(sortAndLimitData)
        .then(printCounts);
};

var cli = {
    functions: {
        addToSessions: addToSessions,
        contLog: countLog,
        filterResults: filterResults,
        generateAverages: generateAverages,
        getSortArray: getSortArray,
        groupData: groupData,
        incrementValues: incrementValues,
        printCounts: printCounts,
        printSummary: printSummary,
        setupNewUserId: setupNewUserId,
        sortAndLimitData: sortAndLimitData
    },
    run: run
};

module.exports = cli;