var chalk = require('chalk');
var lo = require('lodash');
var jsonfile = require('jsonfile');
var moment = require('moment');
var Q = require('q');

const { table } = require('table');

var errorCodes = require('./errorCodes.js');
var sfdc = require('./sfdc.js');

/**
 * Escape a string with single quotes
 * @param {string} data The data to escape
 * @returns {string} The escaped string
 */
var escapeString = function (data) {
    return '\'' + data.replace(/'/, '\\\'') + '\'';
};

/**
 * Log an error
 * @param {Error} error The error
 * @returns {undefined}
 */
var logError = function (error) {
    global.logger.error(error);
};

/**
 * Limits a set of data without a promise
 * @param {object} data The data to limit.
 * @param {string} key The in the data to limit.
 * @param {number} limit The number of records to limit to
 * @returns {object} The limited data
 */
var limitNoPromise = function (data, key, limit) {
    if (limit !== undefined) {
        global.logger.debug('Limiting to ' + limit);
        lo.set(data, key, lo.slice(lo.get(data, key), 0, limit));
    }

    return data;
};

/**
 * Limit a set of data based on a key and a limit
 * @param {object} data The data to limit.
 * @param {string} key The in the data to limit.
 * @param {number} limit The number of records to limit to
 * @returns {Promise} A promise with the limited data
 */
function genericLimit(data, key, limit) {
    var deferred = Q.defer();

    deferred.resolve(limitNoPromise(data, key, limit));

    return deferred.promise;
}

/**
 * Limit a set of data based on a key using the global limit
 * @param {object} data The data to limit.
 * @param {string} key The in the data to limit.
 * @returns {Promise} A promise with the limited data
 */
var limitResults = function (data, key) {
    return genericLimit(data, key, global.config.limit);
};

/**
 * Limit a set of data based on a key using the global sublimit
 * @param {object} data The data to limit.
 * @param {string} key The in the data to limit.
 * @returns {Promise} A promise with the limited data
 */
var subLimitResults = function (data, key) {
    return genericLimit(data, key, global.config.sublimit);
};

/**
 * Gets the most recent files
 * @param {array} event_log_files All the log files to sort through
 * @returns {object} A map of event type to the most recent log files
 */
function getMostRecentFiles(event_log_files) {
    var most_recent_files = {};

    lo.forEach(event_log_files, function (event_log_file) {
        if (!lo.has(most_recent_files, event_log_file.EventType)) {
            lo.set(most_recent_files, event_log_file.EventType, event_log_file);
            return;
        }

        if (moment(lo.get(most_recent_files, event_log_file.EventType).LogDate).isAfter(event_log_file.LogDate)) {
            lo.set(most_recent_files, event_log_file.EventType, event_log_file);
        }
    });

    return most_recent_files;
}

/**
 * Fetch and convert a list of log files
 * @param {array} event_log_files The event log files to download
 * @returns {Promise} A promise for the data from the event log files
 */
var fetchAndConvert = function (event_log_files) {
    var most_recent_files;
    var results = [];
    var promises = [];
    var deferred = Q.defer();

    if (lo.isEmpty(event_log_files)) {
        global.logger.error('Unable to find log files');
        process.exit(errorCodes.NO_LOGFILES);
    }

    if (global.config.latest) {
        most_recent_files = getMostRecentFiles(event_log_files);
    }

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
        });

    return deferred.promise;
};

/**
 * Sort a set of data based on a key and a sorter
 * @param {object} data The data to sort.
 * @param {string} key The key of the data to sort.
 * @param {string} sorter The string of fields to sort by.
 * @returns {object} The sorted data
 */
var sortNoPromise = function (data, key, sorter) {
    global.logger.debug('Sorting by ' + sorter);
    lo.set(data, key, lo.sortBy(lo.get(data, key), lo.split(sorter, ',')).reverse());

    if (global.config.asc) {
        global.logger.debug('Ascending');

        lo.set(data, key, lo.get(data, key).reverse());
    }

    return data;
};

/**
 * Sort a set of data based on a key and a sorter
 * @param {object} data The data to sort.
 * @param {string} key The key of the data to sort.
 * @param {string} sorter The string of fields to sort by.
 * @returns {Promise} A promise with the sorted data
 */
function genericSort(data, key, sorter) {
    var deferred = Q.defer();

    deferred.resolve(sortNoPromise(data, key, sorter));

    return deferred.promise;
}

/**
 * Sort a set of data based on a key using the global sort
 * @param {object} data The data to sort.
 * @param {string} key The in the data to sort.
 * @returns {Promise} A promise with the sorted data
 */
var sortResults = function (data, key) {
    return genericSort(data, key, global.config.sort);
};

/**
 * Sort a set of data based on a key using the global subort
 * @param {object} data The data to sort.
 * @param {string} key The in the data to sort.
 * @returns {Promise} A promise with the sorted data
 */
var subSortResults = function (data, key) {
    return genericSort(data, key, global.config.subsort);
};

/**
 * Generates an array of table data
 * @param {array} rows The row data
 * @param {array} columns The columns (in order)
 * @param {object} output_info The column metadata
 * @return {array} The table data
 */
var generateTableData = function (rows, columns, output_info) {
    var drow = [];
    var data = [];

    lo.forEach(columns, function (column) {
        drow.push(chalk.bold(output_info[column].header));
    });

    data.push(drow);

    lo.forEach(rows, function (row) {
        drow = [];
        lo.forEach(columns, function (column) {
            drow.push(output_info[column].formatter(row[column]));
        });
        data.push(drow);
    });

    return data;
};

/**
 * Prints the averages based on the format
 * @param {object} data The data
 * @param {array} columns The columns
 * @param {object} output_info The column metadata
 * @returns {Promise} A promise for when the data has been printed
 */
var printFormattedData = function (data, columns, output_info) {
    var deferred = Q.defer();

    if (global.config.format === 'json') {
        global.logger.log(data);
    } else if (global.config.format === 'table') {
        global.logger.log(table(generateTableData(data, columns, output_info)));
    }

    deferred.resolve();

    return deferred.promise;
};

/**
 * Write JSON data to a file
 * @param {object} data The data
 * @param {string} filename The file name
 * @returns {Promise} A promise for when the file was written
 */
var writeJSONtoFile = function (data, filename) {
    var deferred = Q.defer();

    jsonfile.writeFile(filename, data, function (error) {
        if (error) {
            deferred.reject(error);
        } else {
            deferred.resolve();
        }
    });

    return deferred.promise;
};

/**
 * Splits data to a map by a field
 * @param {object} data The data
 * @param {string} field_name The field name
 * @returns {object} A map of field_name to an array of data
 */
var splitByField = function (data, field_name) {
    var field_value;
    var results = {};

    lo.forEach(data, function (row) {
        field_value = lo.get(row, field_name);

        if (field_value === undefined) {
            return;
        }

        if (!lo.has(results, field_value)) {
            lo.set(results, field_value, []);
        }

        results[field_value].push(row);
    });

    return results;
};

/**
 * Output the logs to the console
 * @param {array} data The data to output
 * @returns {Promise} A promise for when the data has been outputted
 */
function outputJSONToConsole(data) {
    var deferred = Q.defer();

    global.logger.log(JSON.stringify(data));
    deferred.resolve();

    return deferred.promise;
}

var utils = {
    escapeString: escapeString,
    fetchAndConvert: fetchAndConvert,
    generateTableData: generateTableData,
    logError: logError,
    limitNoPromise: limitNoPromise,
    limitResults: limitResults,
    outputJSONToConsole: outputJSONToConsole,
    printFormattedData: printFormattedData,
    sortNoPromise: sortNoPromise,
    sortResults: sortResults,
    splitByField: splitByField,
    subLimitResults: subLimitResults,
    subSortResults: subSortResults,
    writeJSONtoFile: writeJSONtoFile
};

module.exports = utils;