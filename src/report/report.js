var lo = require('lodash');
var Q = require('q');

var formatter = require('../lib/formatter.js');
var report = require('../lib/report.js');
var sfdc = require('../lib/sfdc.js');
var queries = require('../lib/queries.js');
var utils = require('../lib/utils.js');

var COLUMNS = [
    'name',
    'id',
    'count',
    'cpu',
    'run',
    'dbtotal',
    'dbcpu',
    'rowcount'
];

var DATA_MAP = {
    'cpu': 'CPU_TIME',
    'run': 'RUN_TIME',
    'dbtotal': 'DB_TOTAL_TIME',
    'dbcpu': 'DB_CPU_TIME',
    'rowcount': 'ROW_COUNT'
};

var OUTPUT_INFO = {
    'name': {
        header: 'Name',
        formatter: formatter.noop
    },
    'id': {
        header: 'Id',
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
    'dbtotal': {
        header: 'DB Time',
        formatter: formatter.nanoToMsToPretty
    },
    'dbcpu': {
        header: 'DB CPU Time',
        formatter: formatter.prettyms
    },
    'rowcount': {
        header: 'Row Count',
        formatter: formatter.noop
    }
};

/**
 * Generates the name
 * @param {object} log The log
 * @returns {string} The name
 */
var generateName = function (log) {
    return utils.trimId(log.REPORT_ID_DERIVED);
};

/**
 * Generates the averages for a single group
 * @param {array} logs The logs
 * @param {string} name The name
 * @return {promise} A promise for an average for the group
 */
function generateGroupAverage(logs, name) {
    var deferred = Q.defer();
    var averages = {
        name: name,
        id: name,
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
}

/**
 * Queries the report metadata
 * @param {array} ids The report ids
 * @return {Promise} A promise for the report metadata
 */
function getReportMetadata(ids) {
    return sfdc.query(queries.general.reports(ids));
}

/**
 * Generate the averages for every method
 * @param {object} grouping The grouping of method
 * @returns {Promise} A promise for all the averages for all the methods
 */
function generateAverages(grouping) {
    var deferred = Q.defer();
    var promises = [];
    var averages = [];
    var report_ids = [];

    lo.forEach(grouping, function (value, key) {
        report_ids.push(key);
        promises.push(generateGroupAverage(value, key));
    });

    Q.allSettled(promises)
        .then(function (results) {
            lo.forEach(results, function (result) {
                if (result.state === 'fulfilled') {
                    averages.push(result.value);
                }
            });

            getReportMetadata(report_ids)
                .then(function (reports) {
                    var report_map = utils.idToObject(reports);

                    lo.forEach(averages, function (average, i) {
                        if (lo.has(report_map, average.name)) {
                            averages[i].name = lo.get(report_map, average.name).Name;
                        }
                    });

                    deferred.resolve({
                        grouping: grouping, averages: averages
                    });
                });
        });

    return deferred.promise;
}

var report_structure = {
    COLUMNS: COLUMNS,
    DATA_MAP: DATA_MAP,
    OUTPUT_INFO: OUTPUT_INFO,
    generateAverages: generateAverages,
    generateName: generateName,
    query: queries.report.report
};

module.exports = report_structure;