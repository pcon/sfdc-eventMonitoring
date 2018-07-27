var lo = require('lodash');

var CONNECTION = {
    SANDBOX_URL: 'https://test.salesforce.com',
    PROD_URL: 'https://login.salesforce.com',
    VERSION: '43.0'
};

var LOGIN_STATUS = require('./statics/loginStatus.js');

var DATETIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss.000\\Z';
var DATE_FORMAT = 'YYYY-MM-DD';

/**
 * Get the message for a given key
 * @param {string} key The key
 * @returns {string} The message or the key if not found
 */
var getMessage = function (key) {
    var messages = LOGIN_STATUS;
    if (
        !lo.has(messages, key) ||
        lo.get(messages, key) === undefined
    ) {
        return key;
    }

    return lo.get(messages, key);
};

var static = {
    CONFIG: require('./statics/config.js'), // eslint-disable-line global-require
    CONNECTION: CONNECTION,
    DATE_FORMAT: DATE_FORMAT,
    DATETIME_FORMAT: DATETIME_FORMAT,
    getMessage: getMessage,
    LOG_TYPES: require('./statics/logTypes.js').types, // eslint-disable-line global-require
    report: require('./statics/report.js') // eslint-disable-line global-require
};

module.exports = static;