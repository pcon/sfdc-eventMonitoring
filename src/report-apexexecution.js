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
    'entry',
    'count',
    'cpu',
    'run',
    'exec',
    'dbtotal',
    'callout',
    'soql'
];

var DATA_MAP = {
    'cpu': 'CPU_TIME',
    'run': 'RUN_TIME',
    'exec': 'EXEC_TIME',
    'dbtotal': 'DB_TOTAL_TIME',
    'callout': 'CALLOUT_TIME',
    'soql': 'NUMBER_SOQL_QUERIES'
};

var OUTPUT_INFO = {
    'entry': {
        header: 'Entry Point',
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
    'exec': {
        header: 'Execution Time',
        formatter: formatter.prettyms
    },
    'dbtotal': {
        header: 'DB Total Time',
        formatter: formatter.nanoToMsToPretty
    },
    'callout': {
        header: 'Callout Time',
        formatter: formatter.prettyms
    },
    'soql': {
        header: 'SOQL Count',
        formatter: formatter.noop
    }
};

function generateName(log) {
    return log.ENTRY_POINT;
}

var groupByEntryPoint = function (logs) {
    var grouping = {},
        deferred = Q.defer();

    lo.forEach(logs, function (log) {
        if (!lo.has(grouping, generateName(log))) {
            grouping[generateName(log)] = [];
        }

        grouping[generateName(log)].push(log);
    });

    deferred.resolve(grouping);

    return deferred.promise;
};

var generateAveragesForName = function (logs, name) {
    var averages = {
            entry: name,
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
        promises.push(generateAveragesForName(value, key));
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

    sfdc.query(queries.report.apexexecution())
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
        }).then(groupByEntryPoint)
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