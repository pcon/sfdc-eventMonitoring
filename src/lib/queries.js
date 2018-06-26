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

var stringEscape = function (element) {
    return '\'' + element.replace(/'/, '\\\'') + '\'';
};

function formatCriteria(criteria) {
    if (lo.isString(criteria)) {
        return criteria;
    }

    if (lo.isArray(criteria)) {
        return lo.join(criteria, ' and ');
    }

    return lo.join(criteria.clauses, ' ' + lo.trim(lo.get(criteria, 'operator', 'and') + ' '));
}

function buildSimpleQuery(fields, object_name, criteria, order_by, limit) {
    var final_criteria = formatCriteria(criteria);
    var query = 'select ' + lo.join(fields, ', ') + ' from ' + object_name + ' where ' + final_criteria;

    if (order_by !== undefined) {
        query += ' order by ' + order_by
    }

    if (limit !== undefined) {
        query += ' limit ' + limit;
    }

    return query;
}

function getLogDate() {
    return (lo.toLower(global.config.interval) === 'hourly') ? 'LogDate = TODAY' : 'LogDate = LAST_N_DAYS:2';
}

function getInterval() {
    return 'Interval = ' + stringEscape(lo.upperFirst(global.config.interval));
}

function getEventTypeCriteria(types) {
    var event_types = [];

    if (!lo.isArray(types)) {
       return 'EventType = ' + stringEscape(types);
    }

    lo.forEach(types, function (type) {
        event_types.push(stringEscape(type));
    });

    return 'EventType in (' + event_types + ')';
}

function getLogsByType(types) {
    var criteria = [
            getLogDate(),
            getInterval(),
            getEventTypeCriteria(types)
        ];


    return buildSimpleQuery(EVENT_LOG_FILE_FIELDS, EVENT_LOG_FILE, criteria, 'LogDate desc', 1);
}

var blameAPIUsage = function () {
    var criteria = [
        getLogDate(),
        getInterval(),
        getEventTypeCriteria(['ApexSoap', 'API', 'RestApi'])
    ];

    return buildSimpleQuery(EVENT_LOG_FILE_FIELDS, EVENT_LOG_FILE, criteria);
};

var login = function () {
    return getLogsByType('Login');
};

var generalUsers = function (user_ids) {
    var criteria,
        escaped_ids = [];

    lo.forEach(user_ids, function (id) {
        escaped_ids.push(utils.escapeString(id));
    });

    criteria = [
        'Id in (' + escaped_ids + ')'
    ];

    return buildSimpleQuery(USER_FIELDS, USER, criteria);
};

var reportApexExecution = function () {
    return getLogsByType('ApexExecution');
};

var reportApexSoap = function () {
    return getLogsByType('ApexSoap');
};

var reportApexTrigger = function () {
    return getLogsByType('ApexTrigger');
};

var reportVisualforce = function () {
    return getLogsByType('VisualforceRequest');
};

var queries = {
    blame: {
        apiusage: blameAPIUsage
    },
    login: login,
    general: {
        users: generalUsers
    },
    report: {
        apexexecution: reportApexExecution,
        apexsoap: reportApexSoap,
        apextrigger: reportApexTrigger,
        visualforce: reportVisualforce
    }
};

module.exports = queries;