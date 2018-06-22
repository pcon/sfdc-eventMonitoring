var chalk = require('chalk');
var lo = require('lodash');
var prettyms = require('pretty-ms');
var prettybytes = require('pretty-bytes');
var Q = require('q');

const { table } = require('table');

var logger = require('./lib/logger.js');
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

var noop = function (data) {
    return data;
}

var nanoToMsToPretty = function (data) {
    return prettyms(data / 1000000);
}

var OUTPUT_INFO = {
    'uri': {
        header: 'URI',
        formatter: noop
    },
    'count': {
        header: 'Count',
        formatter: noop
    },
    'cpu': {
        header: 'CPU Time',
        formatter: prettyms
    },
    'run': {
        header: 'Run Time',
        formatter: prettyms
    },
    'view': {
        header: 'View State Size',
        formatter: prettybytes
    },
    'response': {
        header: 'Response Size',
        formatter: prettybytes
    },
    'dbcpu': {
        header: 'DB CPU Time',
        formatter: prettyms
    },
    'dbtotal': {
        header: 'DB Total Time',
        formatter: nanoToMsToPretty
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
            count: lo.size(logs),
            cpu: 0,
            run: 0,
            response: 0,
            view: 0,
            dbcpu: 0,
            dbtotal: 0
        },
        data_map = {
            'cpu': 'CPU_TIME',
            'run': 'RUN_TIME',
            'response': 'RESPONSE_SIZE',
            'view': 'VIEW_STATE_SIZE',
            'dbcpu': 'DB_CPU_TIME',
            'dbtotal': 'DB_TOTAL_TIME'
        },
        deferred = Q.defer();

    lo.forEach(logs, function (log) {
        lo.forEach(data_map, function (value, key) {
            averages[key] += parseInt(log[value]);
        });
    });

    lo.forEach(data_map, function (value, key) {
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

var sortAverages = function (data) {
    var deferred = Q.defer();

    logger.debug('Sorting by ' + global.config.sort);
    data.averages = lo.sortBy(data.averages, lo.split(global.config.sort, ',')).reverse();

    if (global.config.asc) {
        logger.debug('Ascending');

        data.averages = data.averages.reverse();
    }

    deferred.resolve(data);

    return deferred.promise;
};

var limitAverages = function (data) {
    var deferred = Q.defer();

    if (global.config.limit !== undefined) {
        logger.debug('Limiting to ' + global.config.limit);
        data.averages = lo.slice(data.averages, 0, global.config.limit);
    }

    deferred.resolve(data);

    return deferred.promise;
};

function generateTableData(rows) {
    var drow = [], data = [];

    lo.forEach(COLUMNS, function (column) {
        drow.push(chalk.bold(OUTPUT_INFO[column].header));
    });

    data.push(drow);

    lo.forEach(rows, function (row) {
        drow = [];
        lo.forEach(COLUMNS, function (column) {
            drow.push(OUTPUT_INFO[column].formatter(row[column]));
        });
        data.push(drow);
    });

    return data;
}

var printAverages = function (data) {
    var deferred = Q.defer();

    if (global.config.format === 'json') {
        logger.log(data);
    } else if (global.config.format === 'table') {
        logger.log(table(generateTableData(data.averages)));
    }

    deferred.resolve();

    return deferred.promise;
};

var run = function () {
    'use strict';

    sfdc.query(queries.report.visualforce())
        .then(function (event_log_files) {
            var deferred = Q.defer();

            sfdc.fetchConvertFile(event_log_files[0].LogFile)
                .then(function (data) {
                    deferred.resolve(data);
                }).catch(function (error) {
                    deferred.reject(error);
                })

            return deferred.promise;
        }).then(groupByPage)
        .then(generateAverages)
        .then(sortAverages)
        .then(limitAverages)
        .then(printAverages)
        .catch(function (error) {
            logger.error(error);
        });
};

var cli = {
    run: run
};

module.exports = cli;