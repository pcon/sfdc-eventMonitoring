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
var summary = require('./login-apiversion-summary.js');
var queries = require('./lib/queries');

var COLUMNS = [
    'version',
    'username',
    'count'
];


var OUTPUT_INFO = {
    'version': {
        header: 'Version',
        formatter: formatter.noop
    },
    'username': {
        header: 'Username',
        formatter: formatter.noop
    },
    'count': {
        header: 'Count',
        formatter: formatter.noop
    }
};

function generateUsername(log) {
    return log.USER_NAME;
}

function generateVersion(log) {
    return parseInt(log.API_VERSION);
}

var groupByVersionAndUsername = function (logs) {
    var version, username,
        grouping = {},
        deferred = Q.defer();

    lo.forEach(logs, function (log) {
        version = generateVersion(log);
        username = generateUsername(log);

        if (
            lo.isEmpty(log.API_TYPE) ||
            version >= global.config.maxversion
        ) {
            return;
        }

        if (!lo.has(grouping, version)) {
            grouping[version] = {};
        }

        if (!lo.has(grouping[version], username)) {
            grouping[version][username] = [];
        }

        grouping[version][username].push(log);
    });

    deferred.resolve(grouping);

    return deferred.promise;
};

var generateCountsForVersionAndUsername = function (logs, version, username) {
    var counts = {
            version: parseInt(version),
            username: username,
            count: lo.size(logs)
        },
        deferred = Q.defer();

    deferred.resolve(counts);

    return deferred.promise;
};

var generateCounts = function (grouping) {
    var promises = [],
        counts = [],
        deferred = Q.defer();

    lo.forEach(grouping, function (subgrouping, version) {
        lo.forEach(subgrouping, function (logs, username) {
            promises.push(generateCountsForVersionAndUsername(logs, version, username));
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
        global.logger.log(table(report.generateTableData(data.counts, COLUMNS, OUTPUT_INFO)));
    }

    deferred.resolve();

    return deferred.promise;
};

var run = function () {
    'use strict';

    if (global.config.summary) {
        summary.run();
    } else {
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
            }).then(groupByVersionAndUsername)
            .then(generateCounts)
            .then(login.sortCounts)
            .then(login.limitCounts)
            .then(printCounts)
            .catch(function (error) {
                global.logger.error(error);
            });
    }
};

var cli = {
    run: run
};

module.exports = cli;