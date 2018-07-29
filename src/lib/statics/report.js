var lo = require('lodash');

var loginStatus = require('./loginStatus.js');
var formatter = require('../formatter.js');

/**
 * Generates a single entry
 * @param {string} header The header
 * @param {function} formatter_func The formatter function
 * @return {object} The entry
 */
var generateEntry = function (header, formatter_func) {
    return {
        header: header,
        formatter: formatter_func
    };
};

var OUTPUT_INFO = {
    '_count': generateEntry('Count', formatter.noop),
    '_name': generateEntry('Name', formatter.noop),
    '_user_id': generateEntry('Id', formatter.noop),
    '_username': generateEntry('Username', formatter.noop),
    callout: generateEntry('Callout Time', formatter.prettyms),
    count: generateEntry('Count', formatter.noop),
    cpu: generateEntry('CPU Time', formatter.prettyms),
    date: generateEntry('Date', formatter.noop),
    dbcpu: generateEntry('DB CPU Time', formatter.prettyms),
    dbtotal: generateEntry('DB Total Time', formatter.nanoToMsToPretty),
    endpoint: generateEntry('Endpoint', formatter.noop),
    exec: generateEntry('Execution Time', formatter.prettyms),
    id: generateEntry('Id', formatter.noop),
    limit: generateEntry('Usage Percentage Limit', formatter.percent),
    message: generateEntry('Error Message', loginStatus.getMessage),
    name: generateEntry('Name', formatter.noop),
    request: generateEntry('Request Size', formatter.prettybytes),
    response: generateEntry('Response Size', formatter.prettybytes),
    rowcount: generateEntry('Row Count', formatter.noop),
    run: generateEntry('Run Time', formatter.prettyms),
    size: generateEntry('Usage', formatter.prettybytes),
    soql: generateEntry('SOQL Count', formatter.noop),
    time: generateEntry('Total Time', formatter.prettyms),
    username: generateEntry('Username', formatter.noop),
    version: generateEntry('Version', formatter.noop),
    view: generateEntry('View State Size', formatter.prettybytes)
};

/**
 * Generates output info for an array of fields
 * @param {string[]} fields The field names to get
 * @return {object} Output info
 */
var generateOutputInfo = function (fields) {
    var result = {};

    lo.each(fields, function (field) {
        lo.set(result, field, lo.assign({}, lo.get(OUTPUT_INFO, field)));
    });

    return result;
};

module.exports = {
    generateEntry: generateEntry,
    generateOutputInfo: generateOutputInfo
};