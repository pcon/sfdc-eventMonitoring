var formatter = require('../lib/formatter.js');
var queries = require('../lib/queries.js');

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