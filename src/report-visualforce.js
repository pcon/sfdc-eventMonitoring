var lo = require('lodash');
var process = require('process');
var Q = require('q');

const { table } = require('table');

var errorCodes = require('./lib/errorCodes.js');
var formatter = require('./lib/formatter.js');
var report = require('./lib/report.js');
var sfdc = require('./lib/sfdc.js');
var queries = require('./lib/queries');

var COLUMNS = [
    'uri',
    'count',
    'cpu',
    'run',
    'view',
    'response',
    'dbcpu',
    'dbtotal'
];

var DATA_MAP = {
    'cpu': 'CPU_TIME',
    'run': 'RUN_TIME',
    'response': 'RESPONSE_SIZE',
    'view': 'VIEW_STATE_SIZE',
    'dbcpu': 'DB_CPU_TIME',
    'dbtotal': 'DB_TOTAL_TIME'
};

var OUTPUT_INFO = {
    'uri': {
        header: 'URI',
        formatter: formatter.noop
    },
    'count': {
        header: 'Count',
        formatter: formatter.noop
    },
    'cpu': {
        header: 'CPU Time',
        formatter: formatter.prettyms
    },
    'run': {
        header: 'Run Time',
        formatter: formatter.prettyms
    },
    'view': {
        header: 'View State Size',
        formatter: formatter.prettybytes
    },
    'response': {
        header: 'Response Size',
        formatter: formatter.prettybytes
    },
    'dbcpu': {
        header: 'DB CPU Time',
        formatter: formatter.prettyms
    },
    'dbtotal': {
        header: 'DB Total Time',
        formatter: formatter.nanoToMsToPretty
    }
};

var groupByPage = function (logs) {
    var grouping = {},
        deferred = Q.defer();

    lo.forEach(logs, function (log) {
        if (!lo.has(grouping, log.URI)) {
            grouping[log.URI] = [];
        }

        grouping[log.URI].push(log);
    });

    deferred.resolve(grouping);

    return deferred.promise;
};

var generateAveragesForUri = function (logs, uri) {
    var averages = {
            uri: uri,
            count: lo.size(logs)
        },
        deferred = Q.defer();

    averages = report.initializeAverages(averages, DATA_MAP);

    lo.forEach(logs, function (log) {
        lo.forEach(DATA_MAP, function (value, key) {
            averages[key] += parseInt(log[value]);
        });
    });

    lo.forEach(DATA_MAP, function (value, key) {
        averages[key] /= lo.size(logs);
        averages[key] = Number(averages[key].toFixed(2));
    });

    deferred.resolve(averages);

    return deferred.promise;
};

var generateAverages = function (grouping) {
    var promises = [],
        averages = [],
        deferred = Q.defer();

    lo.forEach(grouping, function (value, key) {
        promises.push(generateAveragesForUri(value, key));
    });

    Q.allSettled(promises)
        .then(function (results) {
            lo.forEach(results, function (result) {
                if (result.state === 'fulfilled') {
                    averages.push(result.value);
                }
            });

            deferred.resolve({grouping: grouping, averages: averages})
        });

    return deferred.promise;
};

var printAverages = function (data) {
    var deferred = Q.defer();

    if (global.config.format === 'json') {
        global.logger.log(data);
    } else if (global.config.format === 'table') {
        global.logger.log(table(report.generateTableData(data.averages, COLUMNS, OUTPUT_INFO)));
    }

    deferred.resolve();

    return deferred.promise;
};

var run = function () {
    'use strict';

    sfdc.query(queries.report.visualforce())
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
        }).then(groupByPage)
        .then(generateAverages)
        .then(report.sortAverages)
        .then(report.limitAverages)
        .then(printAverages)
        .catch(function (error) {
            global.logger.error(error);
        });
};

var cli = {
    run: run
};

module.exports = cli;