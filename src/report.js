var lo = require('lodash');
var Q = require('q');

var conf = require('./lib/config.js');
var logging = require('./lib/logging.js');
var report = require('./lib/report.js');
var sfdc = require('./lib/sfdc.js');
var utils = require('./lib/utils.js');
var qutils = require('./lib/qutils.js');

var apexcallout = require('./report/apexcallout.js');
var apexexecution = require('./report/apexexecution.js');
var apexsoap = require('./report/apexsoap.js');
var apextrigger = require('./report/apextrigger.js');
var report_report = require('./report/report.js');
var visualforce = require('./report/visualforce.js');

var handlers = {
    apexcallout: apexcallout,
    apexexecution: apexexecution,
    apexsoap: apexsoap,
    apextrigger: apextrigger,
    report: report_report,
    visualforce: visualforce
};

var OPTIONS = conf.yargs.generateOptions([
    'asc',
    'format',
    'limit',
    'sort'
]);

/**
 * Configure the module
 * @param {object} yargs The arguments
 * @returns {undefined}
 */
function config(yargs) {
    'use strict';

    var pdata = conf.yargs.generateTypePdata('The type of report to run', handlers);

    conf.yargs.config(yargs, pdata, OPTIONS);
}

/**
 * Groups the data by the entry point
 * @param {array} logs The Logs
 * @param {object} handler The handler
 * @return {Promise} A promise for the logs grouped by entry point
 */
var groupBy = function (logs, handler) {
    if (handler.groupBy !== undefined) {
        return handler.groupBy(logs);
    }

    var name;
    var deferred = Q.defer();
    var grouping = {};

    lo.forEach(logs, function (log) {
        name = handler.generateName(log);
        if (!lo.has(grouping, name)) {
            grouping[name] = [];
        }

        grouping[name].push(log);
    });

    deferred.resolve(grouping);

    return deferred.promise;
};

/**
 * Generate the averages for every method
 * @param {object} grouping The grouping of method
 * @param {object} handler The handler
 * @returns {Promise} A promise for all the averages for all the methods
 */
function generateAverages(grouping, handler) {
    if (handler.generateAverages !== undefined) {
        return handler.generateAverages(grouping);
    }

    var deferred = Q.defer();
    var promises = [];

    lo.forEach(grouping, function (value, key) {
        if (handler.generateGroupAverage !== undefined) {
            promises.push(handler.generateGroupAverage(value, key));
        } else {
            promises.push(report.generateGroupAverage(value, key, handler.DATA_MAP));
        }
    });

    qutils.allSettledPushValue(deferred, promises, grouping, 'averages');

    return deferred.promise;
}

/**
 * Filters out averages
 * @param {object} data The data to filter
 * @returns {Promise} A promise for filtered data
 */
function filterAverages(data) {
    var deferred = Q.defer();

    if (global.helper !== undefined && global.helper.filter !== undefined) {
        data.averages = lo.filter(data.averages, global.helper.filter);
    }

    deferred.resolve(data);

    return deferred.promise;
}

/**
 * The run method
 * @param {object} args The arguments passed to the method
 * @returns {undefined}
 */
function run(args) {
    conf.merge(args);
    conf.checkHandlers(handlers);

    conf.setupGlobals()
        .then(sfdc.login)
        .then(function () {
            var handler = lo.get(handlers, global.config.type);

            sfdc.query(handler.query())
                .then(utils.fetchAndConvert)
                .then(function (logs) {
                    return groupBy(logs, handler);
                })
                .then(function (grouping) {
                    return generateAverages(grouping, handler);
                })
                .then(filterAverages)
                .then(report.sortAverages)
                .then(report.limitAverages)
                .then(function (data) {
                    return utils.printFormattedData(data.averages, handler.COLUMNS, handler.OUTPUT_INFO);
                })
                .catch(logging.logError);
        })
        .catch(logging.logError);
}

var cli = {
    config: config,
    run: run
};

module.exports = cli;