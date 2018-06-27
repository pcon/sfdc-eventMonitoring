var lo = require('lodash');
var Q = require('q');

var formatter = require('./lib/formatter.js');
var report = require('./lib/report.js');
var sfdc = require('./lib/sfdc.js');
var queries = require('./lib/queries.js');
var utils = require('./lib/utils.js');

var COLUMNS = [
    'uri',
    'count',
    'cpu',
    'run',
    'view',
    'response',
    'dbcpu',
    'dbtotal'
];

var DATA_MAP = {
    'cpu': 'CPU_TIME',
    'run': 'RUN_TIME',
    'response': 'RESPONSE_SIZE',
    'view': 'VIEW_STATE_SIZE',
    'dbcpu': 'DB_CPU_TIME',
    'dbtotal': 'DB_TOTAL_TIME'
};

var OUTPUT_INFO = {
    'uri': {
        header: 'URI',
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
    'view': {
        header: 'View State Size',
        formatter: formatter.prettybytes
    },
    'response': {
        header: 'Response Size',
        formatter: formatter.prettybytes
    },
    'dbcpu': {
        header: 'DB CPU Time',
        formatter: formatter.prettyms
    },
    'dbtotal': {
        header: 'DB Total Time',
        formatter: formatter.nanoToMsToPretty
    }
};

/**
 * Generates the URI
 * @param {object} log The log
 * @returns {string} The URI
 */
function generateURI(log) {
    return log.URI;
}

/**
 * Groups the data by page
 * @param {array} logs The Logs
 * @return {Promise} A promise for the logs grouped by page
 */
var groupByPage = function (logs) {
    var deferred = Q.defer();
    var grouping = {};

    lo.forEach(logs, function (log) {
        if (!lo.has(grouping, generateURI(log))) {
            grouping[generateURI(log)] = [];
        }

        grouping[generateURI(log)].push(log);
    });

    deferred.resolve(grouping);

    return deferred.promise;
};

/**
 * Generates the averages for a single page
 * @param {array} logs The logs
 * @param {string} uri The uri
 * @return {promise} A promise for an average for the page
 */
var generateAveragesForUri = function (logs, uri) {
    var deferred = Q.defer();
    var averages = {
        uri: uri,
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
 * Generate the averages for every page
 * @param {object} grouping The grouping of pages
 * @returns {Promise} A promise for all the averages for all the groupings
 */
var generateAverages = function (grouping) {
    var deferred = Q.defer();
    var promises = [];
    var averages = [];

    lo.forEach(grouping, function (value, key) {
        promises.push(generateAveragesForUri(value, key));
    });

    Q.allSettled(promises)
        .then(function (results) {
            lo.forEach(results, function (result) {
                if (result.state === 'fulfilled') {
                    averages.push(result.value);
                }
            });

            deferred.resolve({
                grouping: grouping,
                averages: averages
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

    sfdc.query(queries.report.visualforce())
        .then(utils.fetchAndConvert)
        .then(groupByPage)
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