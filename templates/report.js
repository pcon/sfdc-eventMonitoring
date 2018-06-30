var lo = require('lodash');
var Q = require('q');

var formatter = require('./lib/formatter.js');
var report = require('./lib/report.js');
var queries = require('./lib/queries.js');

var COLUMNS = [
    'name',
    'count',
    'field1'
];

var DATA_MAP = {
    'field1': 'FIELD_NAME'
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

/**
 * Generates the averages for a single name
 * @param {array} logs The logs
 * @param {string} name The name
 * @return {promise} A promise for an average for the endpoint name
 */
var generateAveragesForName = function (logs, name) {
    var deferred = Q.defer();
    var averages = {
        name: name,
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

var report_structure = {
    COLUMNS: COLUMNS,
    OUTPUT_INFO: OUTPUT_INFO,
    generateAverages: generateAverages,
    groupBy: groupBy,
    query: queries.report.apexexecution
};

module.exports = report_structure;