var lo = require('lodash');

var EVENT_LOG_FILE = 'EventLogFile';
var EVENT_LOG_FILE_FIELDS = [
    'EventType',
    'LogFile',
    'LogDate',
    'LogFileLength'
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

function getLogsByType(type) {

    var criteria = [
        getLogDate(),
        getInterval(),
        'EventType = ' + stringEscape(type)
    ];

    return buildSimpleQuery(EVENT_LOG_FILE_FIELDS, EVENT_LOG_FILE, criteria, 'LogDate desc', 1);
}

var login = function () {
    return getLogsByType('Login');
}

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
    login: login,
    report: {
        apexexecution: reportApexExecution,
        apexsoap: reportApexSoap,
        apextrigger: reportApexTrigger,
        visualforce: reportVisualforce
    }
};

module.exports = queries;