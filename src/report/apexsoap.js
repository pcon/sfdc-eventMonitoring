var queries = require('../lib/queries.js');
var statics = require('../lib/statics.js');

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

var OUTPUT_INFO = statics.report.generateOutputInfo(COLUMNS);

/**
 * Generates the name
 * @param {object} log The log
 * @returns {string} The name
 */
var generateName = function (log) {
    return log.CLASS_NAME + '.' + log.METHOD_NAME;
};

var report_structure = {
    COLUMNS: COLUMNS,
    DATA_MAP: DATA_MAP,
    OUTPUT_INFO: OUTPUT_INFO,
    generateName: generateName,
    query: queries.report.apexsoap
};

module.exports = report_structure;