var lo = require('lodash');
var Q = require('q');

var formatter = require('./lib/formatter.js');
var queries = require('./lib/queries.js');

var COLUMNS = [
    'name',
    'count',
    'field1',
    'field2'
];

var DATA_MAP = {
    'field1': 'FIELD1_NAME',
    'field2': 'FIELD2_NAME'
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
    'feild1': {
        header: 'Human Field Name',
        formatter: formatter.prettyms
    },
    'feild2': {
        header: 'Human Field Name',
        formatter: formatter.prettyms
    }
};

/**
 * Generates the name
 * @param {object} log The log
 * @returns {string} The name
 */
function generateName(log) {
    return log.NAME;
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