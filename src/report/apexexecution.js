var queries = require('../lib/queries.js');
var statics = require('../lib/statics.js');

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

var OUTPUT_INFO = statics.report.generateOutputInfo(COLUMNS);
OUTPUT_INFO.name.header = 'Entry Point';

/**
 * Generates the name
 * @param {object} log The log
 * @returns {string} The name
 */
var generateName = function (log) {
    return log.ENTRY_POINT;
};

var report_structure = {
    COLUMNS: COLUMNS,
    DATA_MAP: DATA_MAP,
    OUTPUT_INFO: OUTPUT_INFO,
    generateName: generateName,
    query: queries.report.apexexecution
};

module.exports = report_structure;