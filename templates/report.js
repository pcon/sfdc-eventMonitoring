var queries = require('../lib/queries.js');
var statics = require('../lib/statics.js');

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

var OUTPUT_INFO = statics.generateOutputInfo(COLUMNS);
OUTPUT_INFO.name.header = 'Overridden Name';

/**
 * Generates the name
 * @param {object} log The log
 * @returns {string} The name
 */
var generateName = function (log) {
    return log.NAME;
};

var report_structure = {
    COLUMNS: COLUMNS,
    DATA_MAP: DATA_MAP,
    OUTPUT_INFO: OUTPUT_INFO,
    generateName: generateName,
    query: queries.report.apexexecution
};

module.exports = report_structure;