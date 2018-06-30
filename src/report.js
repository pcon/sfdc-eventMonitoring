var lo = require('lodash');
var Q = require('q');

var conf = require('./lib/config.js');
var errorCodes = require('./lib/errorCodes.js');
var report = require('./lib/report.js');
var sfdc = require('./lib/sfdc.js');
var utils = require('./lib/utils.js');

var apexexecution = require('./report-apexexecution.js');
var apexsoap = require('./report-apexsoap.js');
var apextrigger = require('./report-apextrigger.js');
var visualforce = require('./report-visualforce.js');

var handlers = {
    apexexecution: apexexecution,
    apexsoap: apexsoap,
    apextrigger: apextrigger,
    visualforce: visualforce
};

/**
 * Configure the module
 * @param {object} yargs The arguments
 * @returns {undefined}
 */
function config(yargs) {
    'use strict';

    yargs.positional('type', {
        type: 'string',
        describe: 'The type of report to run',
        choices: lo.keys(handlers)
    }).options({
        'format': {
            default: 'table',
            describe: 'The format to output',
            type: 'string',
            choices: [ 'json', 'table' ]
        },
        'interval': {
            default: 'hourly',
            describe: 'The interval to use',
            type: 'string',
            choices: [ 'hourly', 'daily' ]
        },
        'latest': {
            default: true,
            describe: 'Use the most recent data',
            type: 'boolean',
            hidden: true
        },
        'asc': {
            default: false,
            describe: 'Sort the data in ascending order',
            type: 'boolean'
        },
        'sort': {
            default: 'count',
            describe: 'The field to sort by.  Use a comma seperated list to sort by multiple fields',
            type: 'string'
        },
        'limit': {
            describe: 'The number of results to limit to',
            type: 'number'
        }
    });
}

/**
 * Generates the averages for a single group
 * @param {array} logs The logs
 * @param {string} name The name
 * @param {object} data_map A map of field name to data name
 * @return {promise} A promise for an average for the group
 */
function generateGroupAverage(logs, name, data_map) {
    var deferred = Q.defer();
    var averages = {
        name: name,
        count: lo.size(logs)
    };

    averages = report.initializeAverages(averages, data_map);

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
}

/**
 * Generate the averages for every method
 * @param {object} grouping The grouping of method
 * @param {object} handler The handler
 * @returns {Promise} A promise for all the averages for all the methods
 */
function generateAverages(grouping, handler) {
    var deferred = Q.defer();
    var promises = [];
    var averages = [];

    lo.forEach(grouping, function (value, key) {
        promises.push(generateGroupAverage(value, key, handler.DATA_MAP));
    });

    Q.allSettled(promises)
        .then(function (results) {
            lo.forEach(results, function (result) {
                if (result.state === 'fulfilled') {
                    averages.push(result.value);
                }
            });

            deferred.resolve({
                grouping: grouping, averages: averages
            });
        });

    return deferred.promise;
}

/**
 * The run method
 * @param {object} args The arguments passed to the method
 * @returns {undefined}
 */
function run(args) {
    conf.merge(args);

    if (
        !lo.has(handlers, global.config.type) ||
        lo.get(handlers, global.config.type) === undefined
    ) {
        global.logger.error(global.config.type + ' does not have a supported report handler');
        process.exit(errorCodes.UNSUPPORTED_HANDLER);
    }

    sfdc.login()
        .then(function () {
            var handler = lo.get(handlers, global.config.type);

            sfdc.query(handler.query())
                .then(utils.fetchAndConvert)
                .then(handler.groupBy)
                .then(function (grouping) {
                    return generateAverages(grouping, handler);
                })
                .then(report.sortAverages)
                .then(report.limitAverages)
                .then(function (data) {
                    return utils.printFormattedData(data.averages, handler.COLUMNS, handler.OUTPUT_INFO);
                })
                .catch(utils.logError);
        })
        .catch(utils.logError);
}

var cli = {
    config: config,
    run: run
};

module.exports = cli;