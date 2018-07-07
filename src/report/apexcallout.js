var lo = require('lodash');
var url = require('url');

var formatter = require('../lib/formatter.js');
var queries = require('../lib/queries.js');

var COLUMNS = [
    'name',
    'count',
    'request',
    'response',
    'time'
];

var DATA_MAP = {
    'request': 'REQUEST_SIZE',
    'response': 'RESPONSE_SIZE',
    'time': 'TIME'
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
    'request': {
        header: 'Request Size',
        formatter: formatter.prettybytes
    },
    'response': {
        header: 'Response Size',
        formatter: formatter.prettybytes
    },
    'time': {
        header: 'Total Time',
        formatter: formatter.prettyms
    }
};

/**
 * Shortens the URL down to just the host and path
 * @param {string} full_url The full URL to parse
 * @returns {string} The shortened URL
 */
function shortenURL(full_url) {
    var parts = url.parse(full_url.replace(/"/g, ''));

    return parts.protocol + '//' + parts.host + parts.pathname;
}

/**
 * Generates the name
 * @param {object} log The log
 * @returns {string} The name
 */
var generateName = function (log) {
    return lo.padEnd(log.TYPE + '.' + log.METHOD, 12) + shortenURL(log.URL);
};

var report_structure = {
    COLUMNS: COLUMNS,
    DATA_MAP: DATA_MAP,
    OUTPUT_INFO: OUTPUT_INFO,
    generateName: generateName,
    query: queries.report.apexcallout
};

module.exports = report_structure;