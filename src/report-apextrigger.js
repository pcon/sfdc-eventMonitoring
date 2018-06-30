var lo = require('lodash');
var Q = require('q');

var formatter = require('./lib/formatter.js');
var queries = require('./lib/queries.js');

var COLUMNS = [
    'name',
    'count',
    'exec'
];

var DATA_MAP = {'exec': 'EXEC_TIME'};

var OUTPUT_INFO = {
    'name': {
        header: 'Name',
        formatter: formatter.noop
    },
    'count': {
        header: 'Count',
        formatter: formatter.noop
    },
    'exec': {
        header: 'Execution Time',
        formatter: formatter.prettyms
    }
};

/**
 * Generate the name
 * @param {object} log The log
 * @returns {string} The name
 */
function generateName(log) {
    return log.TRIGGER_NAME + '.' + log.TRIGGER_TYPE;
}

/**
 * Groups the data by the method name
 * @param {array} logs The logs
 * @returns {Promise} A promise for data group by method name
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
    query: queries.report.apextrigger
};

module.exports = report_structure;