var prettyms = require('pretty-ms');
var prettybytes = require('pretty-bytes');

/**
 * Convert nano seconds to a pretty milliseconds string
 * @param {number} data The nano seconds
 * @returns {string} A pretty version of milliseconds
 */
var nanoToMsToPretty = function (data) {
    return prettyms(data / 1000000);
};

/**
 * Do nothing with the data
 * @param {object} data The data
 * @return {object} The same data
 */
var noop = function (data) {
    return data;
};

/**
 * Output the data as a percentage
 * @param {number} data The percentage
 * @returns {string} The data with a percent sign
 */
var percent = function (data) {
    return data + '%';
};

var formatter = {
    nanoToMsToPretty: nanoToMsToPretty,
    noop: noop,
    percent: percent,
    prettybytes: prettybytes,
    prettyms: prettyms
};

module.exports = formatter;