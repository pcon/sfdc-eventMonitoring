var lo = require('lodash');

var formatter = require('../formatter.js');

/**
 * Generates a single entry
 * @param {string} header The header
 * @param {function} formatter_func The formatter function
 * @return {object} The entry
 */
function generateEntry(header, formatter_func) {
    return {
        header: header,
        formatter: formatter_func
    };
}

var OUTPUT_INFO = {
    callout: generateEntry('Callout Time', formatter.prettyms),
    count: generateEntry('Count', formatter.noop),
    cpu: generateEntry('CPU Time', formatter.prettyms),
    dbcpu: generateEntry('DB CPU Time', formatter.prettyms),
    dbtotal: generateEntry('DB Total Time', formatter.nanoToMsToPretty),
    exec: generateEntry('Execution Time', formatter.prettyms),
    id: generateEntry('Id', formatter.noop),
    limit: generateEntry('Usage Percentage Limit', formatter.percent),
    name: generateEntry('Name', formatter.noop),
    response: generateEntry('Response Size', formatter.prettybytes),
    request: generateEntry('Request Size', formatter.prettybytes),
    rowcount: generateEntry('Row Count', formatter.noop),
    run: generateEntry('Run Time', formatter.prettyms),
    soql: generateEntry('SOQL Count', formatter.noop),
    time: generateEntry('Total Time', formatter.prettyms),
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

module.exports = { generateOutputInfo: generateOutputInfo };