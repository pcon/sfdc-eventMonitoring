var lo = require('lodash');
var process = require('process');
var Q = require('q');

const { table } = require('table');

var errorCodes = require('./lib/errorCodes.js');
var formatter = require('./lib/formatter.js');
var login = require('./lib/login.js');
var report = require('./lib/report.js');
var sfdc = require('./lib/sfdc.js');
var static = require('./lib/static.js');
var queries = require('./lib/queries');

var COLUMNS = [
    'username',
    'count',
    'message'
];


var OUTPUT_INFO = {
    'username': {
        header: 'Username',
        formatter: formatter.noop
    },
    'count': {
        header: 'Count',
        formatter: formatter.noop
    },
    'message': {
        header: 'Error Message',
        formatter: static.getMessage
    }
};

function generateName(log) {
    return log.USER_NAME;
}

function generateMessageKey(log) {
    return log.LOGIN_STATUS;
}

var groupByUsernameAndLoginStatus = function (logs) {
    var name,
        grouping = {},
        deferred = Q.defer();

    lo.forEach(logs, function (log) {
        name = generateName(log);
        key = generateMessageKey(log);

        if (login.wasSuccessful(key)) {
            return;
        }

        if (!lo.has(grouping, name)) {
            grouping[name] = {};
        }

        if (!lo.has(grouping[name], key)) {
            grouping[name][key] = [];
        }

        grouping[name][key].push(log);
    });

    deferred.resolve(grouping);

    return deferred.promise;
};

var generateCountsForUsernameAndLoginStatus = function (logs, username, messageKey) {
    var counts = {
            username: username,
            count: lo.size(logs),
            message: messageKey
        },
        deferred = Q.defer();

    deferred.resolve(counts);

    return deferred.promise;
};

var generateCounts = function (grouping) {
    var promises = [],
        counts = [],
        deferred = Q.defer();

    lo.forEach(grouping, function (subgrouping, username) {
        lo.forEach(subgrouping, function (logs, messageKey) {
            promises.push(generateCountsForUsernameAndLoginStatus(logs, username, messageKey));
        });
    });

    Q.allSettled(promises)
        .then(function (results) {
            lo.forEach(results, function (result) {
                if (result.state === 'fulfilled') {
                    counts.push(result.value);
                }
            });

            deferred.resolve({grouping: grouping, counts: counts})
        });

    return deferred.promise;
};

var printCounts = function (data) {
    var deferred = Q.defer();

    if (global.config.format === 'json') {
        global.logger.log(data.counts);
    } else if (global.config.format === 'table') {
        if (lo.isEmpty(data.counts)) {
            logger.error('No Failed Logins');
            process.exit(0);
        }

        global.logger.log(table(report.generateTableData(data.counts, COLUMNS, OUTPUT_INFO)));
    }

    deferred.resolve();

    return deferred.promise;
};

var run = function () {
    'use strict';

    sfdc.query(queries.login())
        .then(function (event_log_files) {
            var deferred = Q.defer();

            if (lo.isEmpty(event_log_files)) {
                global.logger.error('Unable to find log files');
                process.exit(errorCodes.NO_LOGFILES);
            }

            sfdc.fetchConvertFile(event_log_files[0].LogFile)
                .then(function (data) {
                    deferred.resolve(data);
                }).catch(function (error) {
                    deferred.reject(error);
                })

            return deferred.promise;
        }).then(groupByUsernameAndLoginStatus)
        .then(generateCounts)
        .then(login.sortCounts)
        .then(login.limitCounts)
        .then(printCounts)
        .catch(function (error) {
            global.logger.error(error);
        });
};

var cli = {
    run: run
};

module.exports = cli;