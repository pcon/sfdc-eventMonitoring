var CONNECTION = {
    SANDBOX_URL: 'https://test.salesforce.com',
    PROD_URL: 'https://login.salesforce.com',
    VERSION: '43.0'
};

var DATETIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss.000\\Z';
var DATE_FORMAT = 'YYYY-MM-DD';

var statics = {
    CONFIG: require('./statics/config.js'), // eslint-disable-line global-require
    CONNECTION: CONNECTION,
    DATE_FORMAT: DATE_FORMAT,
    DATETIME_FORMAT: DATETIME_FORMAT,
    LOG_TYPES: require('./statics/logTypes.js').types, // eslint-disable-line global-require
    report: require('./statics/report.js') // eslint-disable-line global-require
};

module.exports = statics;