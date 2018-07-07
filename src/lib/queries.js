var lo = require('lodash');

var utils = require('./utils.js');

var EVENT_LOG_FILE = 'EventLogFile';
var EVENT_LOG_FILE_FIELDS = [
    'EventType',
    'LogFile',
    'LogDate',
    'LogFileLength'
];

var USER = 'User';
var USER_FIELDS = [
    'Id',
    'Name',
    'Username'
];

var REPORT = 'Report';
var REPORT_FIELDS = [
    'Id',
    'Name'
];

/**
 * Format the criteria
 * @param {string|array|object} criteria The where criteria
 * @returns {string} The combined criteria
 */
function formatCriteria(criteria) {
    if (lo.isString(criteria)) {
        return criteria;
    }

    if (lo.isArray(criteria)) {
        return lo.join(criteria, ' and ');
    }

    return lo.join(criteria.clauses, ' ' + lo.trim(lo.get(criteria, 'operator', 'and') + ' '));
}

/**
 * Build a simple query string
 * @param {string[]} fields The fields
 * @param {string} object_name The object name
 * @param {string|array|object} criteria The criteria
 * @param {string} order_by The fields to order by
 * @param {number} limit The limit
 * @returns {string} The query string
 */
function buildSimpleQuery(fields, object_name, criteria, order_by, limit) {
    var final_criteria = formatCriteria(criteria);
    var query = 'select ' + lo.join(fields, ', ') + ' from ' + object_name + ' where ' + final_criteria;

    if (order_by !== undefined) {
        query += ' order by ' + order_by;
    }

    if (limit !== undefined) {
        query += ' limit ' + limit;
    }

    return query;
}

/**
 * Gets the log date criteria
 * @returns {string} The log date criteria based off the config interval
 */
function getLogDate() {
    return lo.toLower(global.config.interval) === 'hourly' ? 'LogDate = TODAY' : 'LogDate = LAST_N_DAYS:2';
}

/**
 * Get the interval criteria
 * @returns {string} The interval based on the global config
 */
function getInterval() {
    return 'Interval = ' + utils.escapeString(lo.upperFirst(global.config.interval));
}

/**
 * Gets the event type criteria based on types
 * @param {string|array} types The types
 * @returns {string} The event type criteria
 */
function getEventTypeCriteria(types) {
    var event_types = [];

    if (!lo.isArray(types)) {
        return 'EventType = ' + utils.escapeString(types);
    }

    lo.forEach(types, function (type) {
        event_types.push(utils.escapeString(type));
    });

    return 'EventType in (' + event_types + ')';
}

/**
 * Gets all the logs
 * @param {array|undefined} types The types to get
 * @returns {string} The query
 */
var getAllLogs = function (types) {
    var criteria = [
        getLogDate(),
        getInterval()
    ];

    if (types !== undefined) {
        criteria.push(getEventTypeCriteria(types));
    }

    return buildSimpleQuery(EVENT_LOG_FILE_FIELDS, EVENT_LOG_FILE, criteria, 'LogDate desc');
};

/**
 * Gets the logs for types
 * @param {string|array} types The types
 * @returns {string} The query
 */
var getLogsByType = function (types) {
    var criteria = [
        getLogDate(),
        getInterval(),
        getEventTypeCriteria(types)
    ];

    return buildSimpleQuery(EVENT_LOG_FILE_FIELDS, EVENT_LOG_FILE, criteria, 'LogDate desc', 1);
};

/**
 * Gets the query for all the "API" usage types
 * @returns {string} The query
 */
var blameAPIUsage = function () {
    var criteria = [
        getLogDate(),
        getInterval(),
        getEventTypeCriteria([ 'ApexSoap', 'API', 'RestApi' ])
    ];

    return buildSimpleQuery(EVENT_LOG_FILE_FIELDS, EVENT_LOG_FILE, criteria);
};

/**
 * Gets the login logs
 * @returns {string} The query
 */
var login = function () {
    return getLogsByType('Login');
};

/**
 * Gets the query for users
 * @param {array} user_ids The user ids
 * @returns {string} The query
 */
var generalUsers = function (user_ids) {
    var criteria = [
        'Id in (' + lo.join(utils.escapeArray(user_ids), ',') + ')'
    ];

    return buildSimpleQuery(USER_FIELDS, USER, criteria);
};

/**
 * Gets the query for reports
 * @param {array} report_ids The report ids
 * @returns {string} The query
 */
var generalReports = function (report_ids) {
    var criteria = [
        'Id in (' + lo.join(utils.escapeArray(report_ids), ',') + ')'
    ];

    return buildSimpleQuery(REPORT_FIELDS, REPORT, criteria);
};

/**
 * Gets the apex execution logs
 * @returns {string} The query
 */
var reportApexExecution = function () {
    return getLogsByType('ApexExecution');
};

/**
 * Gets the apex soap logs
 * @returns {string} The query
 */
var reportApexSoap = function () {
    return getLogsByType('ApexSoap');
};

/**
 * Gets the apex trigger logs
 * @returns {string} The query
 */
var reportApexTrigger = function () {
    return getLogsByType('ApexTrigger');
};

/**
 * Gets the report logs
 * @returns {string} The query
 */
var reportReport = function () {
    return getLogsByType('Report');
};

/**
 * Gets the visualforce logs
 * @returns {string} The query
 */
var reportVisualforce = function () {
    return getLogsByType('VisualforceRequest');
};

var queries = {
    blame: { apiusage: blameAPIUsage },
    login: login,
    general: {
        getAllLogs: getAllLogs,
        reports: generalReports,
        users: generalUsers
    },
    report: {
        apexexecution: reportApexExecution,
        apexsoap: reportApexSoap,
        apextrigger: reportApexTrigger,
        report: reportReport,
        visualforce: reportVisualforce
    }
};

module.exports = queries;