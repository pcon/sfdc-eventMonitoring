var lo = require('lodash');

var config = require('./config.js');
var statics = require('./statics.js');
var utils = require('./utils.js');

var EVENT_LOG_FILE = 'EventLogFile';
var EVENT_LOG_FILE_FIELDS = [
    'Id',
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
var formatCriteria = function (criteria) {
    if (lo.isUndefined(criteria)) {
        return '';
    }

    if (lo.isString(criteria)) {
        return criteria;
    }

    if (lo.isArray(criteria)) {
        return lo.join(criteria, ' and ');
    }

    return lo.trim(lo.join(criteria.clauses, ' ' + lo.trim(lo.get(criteria, 'operator', 'and')) + ' '));
};

/**
 * Build a simple query string
 * @param {string[]} fields The fields
 * @param {string} object_name The object name
 * @param {string|array|object} criteria The criteria
 * @param {string} order_by The fields to order by
 * @param {number} limit The limit
 * @returns {string} The query string
 */
var buildSimpleQuery = function (fields, object_name, criteria, order_by, limit) {
    var final_criteria = formatCriteria(criteria);
    var query = 'select ' + lo.join(fields, ', ') + ' from ' + object_name + ' where ' + final_criteria;

    if (order_by !== undefined) {
        query += ' order by ' + order_by;
    }

    if (limit !== undefined) {
        query += ' limit ' + limit;
    }

    return lo.trim(query);
};

/**
 * Gets the log date criteria
 * @returns {string} The log date criteria based off the config interval
 */
var getLogDate = function () {
    if (config.date.hasADate()) {
        return 'LogDate >= ' + config.date.getStart().format(statics.DATETIME_FORMAT) + ' and LogDate <= ' + config.date.getEnd().format(statics.DATETIME_FORMAT);
    }

    return lo.toLower(global.config.interval) === 'hourly' ? 'LogDate = TODAY' : 'LogDate = LAST_N_DAYS:2';
};

/**
 * Get the interval criteria
 * @returns {string} The interval based on the global config
 */
var getInterval = function () {
    return 'Interval = ' + utils.escapeString(lo.upperFirst(global.config.interval));
};

/**
 * Gets the event type criteria based on types
 * @param {string|array} types The types
 * @returns {string} The event type criteria
 */
var getEventTypeCriteria = function (types) {
    var event_types = [];

    if (!lo.isArray(types)) {
        return 'EventType = ' + utils.escapeString(types);
    }

    lo.forEach(types, function (type) {
        event_types.push(utils.escapeString(type));
    });

    return 'EventType in (' + event_types + ')';
};

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
 * Gets the query for all the "API" usage types
 * @returns {string} The query
 */
var blameAPIUsage = function () {
    var criteria = [
        getLogDate(),
        getInterval(),
        getEventTypeCriteria([ 'ApexSoap', 'API', 'RestAPI' ])
    ];

    return buildSimpleQuery(EVENT_LOG_FILE_FIELDS, EVENT_LOG_FILE, criteria);
};

/**
 * Gets the login logs
 * @returns {string} The query
 */
var login = function () {
    return getAllLogs('Login');
};

/**
 * Generates a criteria for ids
 * @param {string[]} ids Ids
 * @returns {string} The criteria
 */
var inIdCriteria = function (ids) {
    return 'Id in (' + lo.join(utils.escapeArray(ids), ',') + ')';
};

/**
 * Gets the query for users
 * @param {array} user_ids The user ids
 * @returns {string} The query
 */
var generalUsers = function (user_ids) {
    var criteria = [
        inIdCriteria(user_ids)
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
        inIdCriteria(report_ids)
    ];

    return buildSimpleQuery(REPORT_FIELDS, REPORT, criteria);
};

/**
 * Gets the apex callout logs
 * @returns {string} The query
 */
var reportApexCallout = function () {
    return getAllLogs('ApexCallout');
};

/**
 * Gets the apex execution logs
 * @returns {string} The query
 */
var reportApexExecution = function () {
    return getAllLogs('ApexExecution');
};

/**
 * Gets the apex soap logs
 * @returns {string} The query
 */
var reportApexSoap = function () {
    return getAllLogs('ApexSoap');
};

/**
 * Gets the apex trigger logs
 * @returns {string} The query
 */
var reportApexTrigger = function () {
    return getAllLogs('ApexTrigger');
};

/**
 * Gets the report logs
 * @returns {string} The query
 */
var reportReport = function () {
    return getAllLogs('Report');
};

/**
 * Gets the visualforce logs
 * @returns {string} The query
 */
var reportVisualforce = function () {
    return getAllLogs('VisualforceRequest');
};

var queries = {
    blame: { apiusage: blameAPIUsage },
    login: login,
    functions: {
        buildSimpleQuery: buildSimpleQuery,
        formatCriteria: formatCriteria,
        getEventTypeCriteria: getEventTypeCriteria,
        getLogDate: getLogDate,
        getInterval: getInterval,
        inIdCriteria: inIdCriteria
    },
    general: {
        getAllLogs: getAllLogs,
        reports: generalReports,
        users: generalUsers
    },
    report: {
        apexcallout: reportApexCallout,
        apexexecution: reportApexExecution,
        apexsoap: reportApexSoap,
        apextrigger: reportApexTrigger,
        report: reportReport,
        visualforce: reportVisualforce
    }
};

module.exports = queries;