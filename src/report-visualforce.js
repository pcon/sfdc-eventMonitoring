var lo = require('lodash');
var Q = require('q');

var formatter = require('./lib/formatter.js');
var queries = require('./lib/queries.js');

var COLUMNS = [
    'name',
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
    'name': {
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
var groupBy = function (logs) {
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

var report_structure = {
    COLUMNS: COLUMNS,
    DATA_MAP: DATA_MAP,
    OUTPUT_INFO: OUTPUT_INFO,
    groupBy: groupBy,
    query: queries.report.visualforce
};

module.exports = report_structure;