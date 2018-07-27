var queries = require('../lib/queries.js');
var statics = require('../lib/statics.js');

var COLUMNS = [
    'name',
    'count',
    'exec'
];

var DATA_MAP = {'exec': 'EXEC_TIME'};

var OUTPUT_INFO = statics.report.generateOutputInfo(COLUMNS);

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