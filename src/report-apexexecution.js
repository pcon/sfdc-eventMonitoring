var lo = require('lodash');
var Q = require('q');

var formatter = require('./lib/formatter.js');
var report = require('./lib/report.js');
var sfdc = require('./lib/sfdc.js');
var queries = require('./lib/queries.js');
var utils = require('./lib/utils.js');

var COLUMNS = [
    'entry',
    'count',
    'cpu',
    'run',
    'exec',
    'dbtotal',
    'callout',
    'soql'
];

var DATA_MAP = {
    'cpu': 'CPU_TIME',
    'run': 'RUN_TIME',
    'exec': 'EXEC_TIME',
    'dbtotal': 'DB_TOTAL_TIME',
    'callout': 'CALLOUT_TIME',
    'soql': 'NUMBER_SOQL_QUERIES'
};

var OUTPUT_INFO = {
    'entry': {
        header: 'Entry Point',
        formatter: formatter.noop
    },
    'count': {
        header: 'Count',
        formatter: formatter.noop
    },
    'cpu': {
        header: 'CPU Time',
        formatter: formatter.prettyms
    },
    'run': {
        header: 'Run Time',
        formatter: formatter.prettyms
    },
    'exec': {
        header: 'Execution Time',
        formatter: formatter.prettyms
    },
    'dbtotal': {
        header: 'DB Total Time',
        formatter: formatter.nanoToMsToPretty
    },
    'callout': {
        header: 'Callout Time',
        formatter: formatter.prettyms
    },
    'soql': {
        header: 'SOQL Count',
        formatter: formatter.noop
    }
};

/**
 * Generates the name
 * @param {object} log The log
 * @returns {string} The name
 */
function generateName(log) {
    return log.ENTRY_POINT;
}

/**
 * Groups the data by the entry point
 * @param {array} logs The Logs
 * @return {Promise} A promise for the logs grouped by entry point
 */
var groupByEntryPoint = function (logs) {
    var deferred = Q.defer();
    var grouping = {};

    lo.forEach(logs, function (log) {
        if (!lo.has(grouping, generateName(log))) {
            grouping[generateName(log)] = [];
        }

        grouping[generateName(log)].push(log);
    });

    deferred.resolve(grouping);

    return deferred.promise;
};

/**
 * Generates the averages for a single name
 * @param {array} logs The logs
 * @param {string} name The name
 * @return {promise} A promise for an average for the endpoint name
 */
var generateAveragesForName = function (logs, name) {
    var deferred = Q.defer();
    var averages = {
        entry: name,
        count: lo.size(logs)
    };

    averages = report.initializeAverages(averages, DATA_MAP);

    lo.forEach(logs, function (log) {
        lo.forEach(DATA_MAP, function (value, key) {
            averages[key] += parseInt(log[value]);
        });
    });

    lo.forEach(DATA_MAP, function (value, key) {
        averages[key] /= lo.size(logs);
        averages[key] = Number(averages[key].toFixed(2));
    });

    deferred.resolve(averages);

    return deferred.promise;
};

/**
 * Generate the averages for every endpoint
 * @param {object} grouping The grouping of endpoints
 * @returns {Promise} A promise for all the averages for all the groupings
 */
var generateAverages = function (grouping) {
    var deferred = Q.defer();
    var promises = [];
    var averages = [];

    lo.forEach(grouping, function (value, key) {
        promises.push(generateAveragesForName(value, key));
    });

    Q.allSettled(promises)
        .then(function (results) {
            lo.forEach(results, function (result) {
                if (result.state === 'fulfilled') {
                    averages.push(result.value);
                }
            });

            deferred.resolve({
                grouping: grouping, averages: averages
            });
        });

    return deferred.promise;
};

/**
 * Prints the averages based on the format
 * @param {object} data The data
 * @returns {Promise} A promise for when the data has been printed
 */
var printAverages = function (data) {
    return utils.printFormattedData(data.averages, COLUMNS, OUTPUT_INFO);
};

/**
 * The stuff to run
 * @returns {undefined}
 */
var run = function () {
    'use strict';

    sfdc.query(queries.report.apexexecution())
        .then(utils.fetchAndConvert)
        .then(groupByEntryPoint)
        .then(generateAverages)
        .then(report.sortAverages)
        .then(report.limitAverages)
        .then(printAverages)
        .catch(function (error) {
            global.logger.error(error);
        });
};

var cli = {run: run};

module.exports = cli;