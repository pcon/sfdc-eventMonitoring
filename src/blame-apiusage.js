var chalk = require('chalk');
var lo = require('lodash');
var moment = require('moment');
var numeral = require('numeral');
var process = require('process');
var Q = require('q');

const { table } = require('table');

var errorCodes = require('./lib/errorCodes.js');
var formatter = require('./lib/formatter.js');
var login = require('./lib/login.js');
var report = require('./lib/report.js');
var sfdc = require('./lib/sfdc.js');
var static = require('./lib/static.js');
var queries = require('./lib/queries.js');
var utils = require('./lib/utils.js');

var COLUMNS = [
    'endpoint',
    'count'
];

var OUTPUT_INFO = {
    'endpoint': {
        header: 'Endpoint',
        formatter: formatter.noop
    },
    'count': {
        header: 'Count',
        formatter: formatter.noop
    }
};

var SUMMARY_COLUMNS = [
    '_name',
    '_username',
    '_user_id',
    '_count'
];

var SUMMARY_OUTPUT_INFO = {
    '_name': {
        header: 'Name',
        formatter: formatter.noop
    },
    '_username': {
        header: 'Username',
        formatter: formatter.noop
    },
    '_user_id': {
        header: 'Id',
        formatter: formatter.noop
    },
    '_count': {
        header: 'Count',
        formatter: formatter.noop
    }
};

function generateName(log) {
    if (log.EVENT_TYPE === 'RestApi') {
        return log.URI;
    }

    if (log.EVENT_TYPE === 'API') {
        return log.METHOD_NAME + '.' + log.ENTITY_NAME;
    }

    return log.CLASS_NAME + '.' + log.METHOD_NAME;
}

function generateUserId(log) {
    return log.USER_ID;
}

var downloadLogFiles = function (event_log_files) {
    var results = [],
        promises = [],
        most_recent_files = {},
        deferred = Q.defer();

    if (lo.isEmpty(event_log_files)) {
        global.logger.error('Unable to find log files');
        process.exit(errorCodes.NO_LOGFILES);
    }


    lo.forEach(event_log_files, function (event_log_file) {
        if (!lo.has(most_recent_files, event_log_file.EventType)) {
            lo.set(most_recent_files, event_log_file.EventType, event_log_file);
            return;
        }

        if (moment(lo.get(most_recent_files, event_log_file.EventType).LogDate).isAfter(event_log_file.LogDate)) {
            lo.set(most_recent_files, event_log_file.EventType, event_log_file);
        }
    });

    lo.forEach(most_recent_files, function (event_log_file) {
        promises.push(sfdc.fetchConvertFile(event_log_file.LogFile));
    });

    Q.allSettled(promises)
        .then(function (promise_results) {
            lo.forEach(promise_results, function (result) {
                if (result.state === 'fulfilled') {
                    results = lo.concat(results, result.value);
                }
            });

            deferred.resolve(results);
        }).catch(function (error) {
            deferred.reject(error);
        })

    return deferred.promise;
};

var groupByUserIdAndName = function (logs) {
    var name, user_id, data,
        grouping = {},
        deferred = Q.defer();

    lo.forEach(logs, function (log) {
        name = generateName(log);
        user_id = generateUserId(log);

        if (!lo.has(grouping, user_id)) {
            grouping[user_id] = {
                _counts: [],
                _user_id: user_id
            };
        }

        if (!lo.has(grouping[user_id], name)) {
            grouping[user_id][name] = [];
        }

        grouping[user_id][name].push(log);
    });

    lo.forEach(grouping, function (endpoint, user_id) {
        lo.forEach(endpoint, function (logs, name) {
            if (lo.startsWith(name, '_')) {
                return;
            }

            grouping[user_id]._counts.push({
                endpoint: name,
                count: lo.size(logs)
            });
        })
    });

    deferred.resolve(grouping);

    return deferred.promise;
};

var fetchUsernames = function (data) {
    var results = { grouping: data },
        deferred = Q.defer();

    sfdc.query(queries.general.users(lo.keys(data)))
        .then(function (users) {
            results.user_map = {};

            lo.forEach(users, function (user) {
                results.user_map[user.Id.substring(0, 15)] = user;
            });

            deferred.resolve(results);
        }).catch(function (error) {
            deferred.reject(error);
        });

    return deferred.promise;
};

var enrichCounts = function (data) {
    var name, username, count,
        deferred = Q.defer();

    lo.forEach(data.grouping, function (user_data, user_id) {
        count = 0;
        lo.forEach(user_data._counts, function (endpoint) {
            count += endpoint.count;
        });

        name = 'Unknown';
        username = 'Unknown';

        if (lo.has(data.user_map, user_id)) {
            name = data.user_map[user_id].Name;
            username = data.user_map[user_id].Username;
        }

        lo.set(data.grouping, [user_id, '_name'], name);
        lo.set(data.grouping, [user_id, '_username'], username);
        lo.set(data.grouping, [user_id, '_user_id'], user_id);
        lo.set(data.grouping, [user_id, '_count'], count);
    });

    deferred.resolve(data);

    return deferred.promise;
};

var sortCounts = function (data) {
    global.config.sort = '_' + global.config.sort;
    return utils.sortResults(data, 'grouping');
};

var limitCounts = function (data) {
    return utils.limitResults(data, 'grouping');
};

var subSortCounts = function (data) {
    var deferred = Q.defer();

    lo.forEach(data.grouping, function (group) {
        utils.sortNoPromise(group, '_counts', global.config.subsort);
    });

    deferred.resolve(data);
    return deferred.promise;
};

var subLimitCounts = function (data) {
    var deferred = Q.defer();

    lo.forEach(data.grouping, function (group) {
        utils.limitNoPromise(group, '_counts', global.config.sublimit);
    });

    deferred.resolve(data);
    return deferred.promise;
};

function formatGroupInfo(group) {
    var output = chalk.bold('User: ') + group._name + ' - ' + group._username + ' - ' + group._user_id + '\n';
    output += chalk.bold('Total API Calls: ') + numeral(group._count).format('0,0');

    return output;
}

function formatEndpointData(group) {
    return table(report.generateTableData(group._counts, COLUMNS, OUTPUT_INFO));
}

var printCounts = function (data) {
    var deferred = Q.defer();

    if (global.config.format === 'json') {
        global.logger.log(JSON.stringify(data.grouping));
    } else if (global.config.format === 'table') {
        if (global.config.summary) {
            global.logger.log(table(report.generateTableData(data.grouping, SUMMARY_COLUMNS, SUMMARY_OUTPUT_INFO)));
        } else {
            lo.forEach(data.grouping, function (group, user_id) {
                global.logger.log(formatGroupInfo(group));
                global.logger.log(formatEndpointData(group));
            });
        }
    }

    deferred.resolve();

    return deferred.promise;
};

var run = function () {
    'use strict';

    sfdc.query(queries.blame.apiusage())
        .then(downloadLogFiles)
        .then(groupByUserIdAndName)
        .then(fetchUsernames)
        .then(enrichCounts)
        .then(sortCounts)
        .then(limitCounts)
        .then(subSortCounts)
        .then(subLimitCounts)
        .then(printCounts)
        .catch(function (error) {
            global.logger.error(error);
        });
};

var cli = {
    run: run
};

module.exports = cli;