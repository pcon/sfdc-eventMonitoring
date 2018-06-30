var lo = require('lodash');
var Q = require('q');

var formatter = require('./lib/formatter.js');
var queries = require('./lib/queries.js');

var COLUMNS = [
    'name',
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
    'name': {
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
    query: queries.report.apexexecution
};

module.exports = report_structure;