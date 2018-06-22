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

function report(type) {

    var criteria = [
        (lo.toLower(global.config.interval) === 'hourly') ? 'LogDate = TODAY' : 'LogDate = YESTERDAY',
        'Interval = ' + stringEscape(lo.upperFirst(global.config.interval)),
        'EventType = ' + stringEscape(type)
    ];

    return buildSimpleQuery(EVENT_LOG_FILE_FIELDS, EVENT_LOG_FILE, criteria, 'LogDate desc', 1);
};

var reportApexSoap = function () {
    return report('ApexSoap');
};

var reportApexTrigger = function () {
    return report('ApexTrigger');
};

var reportVisualforce = function () {
    return report('VisualforceRequest');
};

var queries = {
    report: {
        apexsoap: reportApexSoap,
        apextrigger: reportApexTrigger,
        visualforce: reportVisualforce
    }
};

module.exports = queries;