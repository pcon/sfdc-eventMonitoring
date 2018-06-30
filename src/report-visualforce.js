var formatter = require('./lib/formatter.js');
var queries = require('./lib/queries.js');

var COLUMNS = [
    'name',
    'count',
    'cpu',
    'run',
    'view',
    'response',
    'dbcpu',
    'dbtotal'
];

var DATA_MAP = {
    'cpu': 'CPU_TIME',
    'run': 'RUN_TIME',
    'response': 'RESPONSE_SIZE',
    'view': 'VIEW_STATE_SIZE',
    'dbcpu': 'DB_CPU_TIME',
    'dbtotal': 'DB_TOTAL_TIME'
};

var OUTPUT_INFO = {
    'name': {
        header: 'URI',
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
    'view': {
        header: 'View State Size',
        formatter: formatter.prettybytes
    },
    'response': {
        header: 'Response Size',
        formatter: formatter.prettybytes
    },
    'dbcpu': {
        header: 'DB CPU Time',
        formatter: formatter.prettyms
    },
    'dbtotal': {
        header: 'DB Total Time',
        formatter: formatter.nanoToMsToPretty
    }
};

/**
 * Generates the name
 * @param {object} log The log
 * @returns {string} The name
 */
var generateName = function (log) {
    return log.URI;
};

var report_structure = {
    COLUMNS: COLUMNS,
    DATA_MAP: DATA_MAP,
    OUTPUT_INFO: OUTPUT_INFO,
    generateName: generateName,
    query: queries.report.visualforce
};

module.exports = report_structure;