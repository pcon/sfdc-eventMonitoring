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
var generateName = function (log) {
    return log.TRIGGER_NAME + '.' + log.TRIGGER_TYPE;
};

var report_structure = {
    COLUMNS: COLUMNS,
    DATA_MAP: DATA_MAP,
    OUTPUT_INFO: OUTPUT_INFO,
    generateName: generateName,
    query: queries.report.apextrigger
};

module.exports = report_structure;