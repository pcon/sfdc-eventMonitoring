var lo = require('lodash');
var Q = require('q');

var report = require('../lib/report.js');
var queries = require('../lib/queries.js');
var qutils = require('../lib/qutils.js');
var sfdc = require('../lib/sfdc.js');
var statics = require('../lib/statics.js');
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

var OUTPUT_INFO = statics.report.generateOutputInfo(COLUMNS);

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
    var additional_data = { id: name };
    return report.generateGroupAverage(logs, name, DATA_MAP, additional_data);
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
    var report_ids = [];

    lo.forEach(grouping, function (value, key) {
        report_ids.push(key);
        promises.push(generateGroupAverage(value, key));
    });

    Q.allSettled(promises)
        .then(function (results) {
            var averages = qutils.getResultValues(results);

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