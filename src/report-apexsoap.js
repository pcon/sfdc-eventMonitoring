var lo = require('lodash');
var Q = require('q');

var formatter = require('./lib/formatter.js');
var queries = require('./lib/queries.js');

var COLUMNS = [
    'name',
    'count',
    'cpu',
    'run',
    'limit',
    'dbtotal'
];

var DATA_MAP = {
    'cpu': 'CPU_TIME',
    'run': 'RUN_TIME',
    'limit': 'LIMIT_USAGE_PERCENT',
    'dbtotal': 'DB_TOTAL_TIME'
};

var OUTPUT_INFO = {
    'name': {
        header: 'Name',
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
    'limit': {
        header: 'Usage Percent Limit',
        formatter: formatter.percent
    },
    'dbtotal': {
        header: 'DB Total Time',
        formatter: formatter.nanoToMsToPretty
    }
};

/**
 * Generates the name
 * @param {object} log The log
 * @returns {string} The name
 */
function generateName(log) {
    return log.CLASS_NAME + '.' + log.METHOD_NAME;
}

/**
 * Groups the data by the method
 * @param {array} logs The Logs
 * @return {Promise} A promise for the logs grouped by method
 */
var groupBy = function (logs) {
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

var report_structure = {
    COLUMNS: COLUMNS,
    DATA_MAP: DATA_MAP,
    OUTPUT_INFO: OUTPUT_INFO,
    groupBy: groupBy,
    query: queries.report.apexsoap
};

module.exports = report_structure;