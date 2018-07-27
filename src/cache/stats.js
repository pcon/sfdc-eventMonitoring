var chalk = require('chalk');
var lo = require('lodash');
var fs = require('fs');
var moment = require('moment');
var path = require('path');
var process = require('process');
var Q = require('q');

const { table } = require('table');

var errorCodes = require('../lib/errorCodes.js');
var formatter = require('../lib/formatter.js');
var qutils = require('../lib/qutils.js');
var statics = require('../lib/statics.js');
var utils = require('../lib/utils.js');

/**
 * Gets all the files in the cache directory
 * @returns {Promise} A promise for when the file are found
 */
var getAllFiles = function () {
    var deferred = Q.defer();

    global.logger.debug('Fetching all files from cache dir ' + global.config.cache);

    fs.readdir(global.config.cache, function (error, files) {
        if (error) {
            deferred.reject(error);
        } else {
            deferred.resolve(files);
        }
    });

    return deferred.promise;
};

/**
 * Gets the stats for a single file
 * @param {string} file The file
 * @returns {Promise} A promise for stats for a file
 */
var getStats = function (file) {
    var deferred = Q.defer();
    var filename = path.join(global.config.cache, file);

    fs.stat(filename, function (error, stats) {
        if (stats !== undefined) {
            stats.filename = file;
        }

        qutils.rejectResolve(deferred, error, stats);
    });

    return deferred.promise;
};

/**
 * Gets all the stats for a list of files
 * @param {string[]} files A list of files
 * @returns {Promise} A promise for all the file stats
 */
var getAllStats = function (files) {
    var deferred = Q.defer();
    var promises = [];

    lo.forEach(files, function (file) {
        promises.push(getStats(file));
    });

    qutils.allSettledPushArray(deferred, promises);

    return deferred.promise;
};

/**
 * Sets the base stat if it doesn't exist for a date
 * @param {object} grouping The grouping
 * @param {string} date The date
 * @returns {undefined}
 */
function setBaseStat(grouping, date) {
    if (!lo.has(grouping.by_date, date)) {
        var base_stat = {
            date: date,
            size: 0
        };

        lo.set(grouping.by_date, date, base_stat);
    }
}

/**
 * Group the stats into something printable
 * @param {object[]} stats The stats to group
 * @return {Promise} A promise for grouped stats
 */
var groupStats = function (stats) {
    var deferred = Q.defer();
    var grouping = {
        total: 0,
        json: 0,
        csv: 0,
        by_date: {}
    };

    lo.forEach(stats, function (stat) {
        var file_path = path.parse(stat.filename);
        var date = moment.utc(parseInt(file_path.base.split('_'))).format(statics.DATE_FORMAT);

        grouping.total += stat.size;

        if (file_path.ext === '.json') {
            grouping.json += stat.size;
        } else if (file_path.ext === '.csv') {
            grouping.csv += stat.size;
        }

        setBaseStat(grouping, date);

        lo.set(grouping.by_date, date + '.size', lo.get(grouping.by_date, date + '.size') + stat.size);
    });

    deferred.resolve(grouping);

    return deferred.promise;
};

/**
 * Prints the stats to the terminal
 * @param {object[]} stats The stats to display
 * @returns {Promise} A promise for when they have been displayed
 */
var printStats = function (stats) {
    var deferred = Q.defer();
    var columns = [
        'date',
        'size'
    ];
    var output_info = statics.report.generateOutputInfo(columns);

    global.logger.log(chalk.bold('Total Size Usage: ') + formatter.prettybytes(stats.total));
    global.logger.log(chalk.bold('      JSON Usage: ') + formatter.prettybytes(stats.json));
    global.logger.log(chalk.bold('       CSV Usage: ') + formatter.prettybytes(stats.csv));
    global.logger.log('\n');
    global.logger.log(table(utils.generateTableData(lo.sortBy(lo.values(stats.by_date), 'date'), columns, output_info)));

    deferred.resolve();

    return deferred.promise;
};

/**
 * The stuff to run
 * @returns {undefined}
 */
var run = function () {
    'use strict';

    if (global.config.cache === undefined) {
        global.logger.error('Cache options are not valid without cache folder being set');
        process.exit(errorCodes.NO_CACHE_DIR);
    }

    getAllFiles()
        .then(getAllStats)
        .then(groupStats)
        .then(printStats)
        .catch(function (error) {
            global.logger.error(error);
        });
};

var cli = {run: run};

module.exports = cli;