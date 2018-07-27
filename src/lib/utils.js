var chalk = require('chalk');
var lo = require('lodash');
var jsonfile = require('jsonfile');
var moment = require('moment');
var Q = require('q');

const { table } = require('table');

var errorCodes = require('./errorCodes.js');
var sfdc = require('./sfdc.js');

/**
 * Trims a provided Id down to 15 characters
 * @param {string} id The Id
 * @returns {string} The shortened Id
 */
var trimId = function (id) {
    if (id === undefined) {
        return;
    }

    return id.substring(0, 15);
};

/**
 * Escape a string with single quotes
 * @param {string} data The data to escape
 * @returns {string} The escaped string
 */
var escapeString = function (data) {
    return '\'' + data.replace(/'/, '\\\'') + '\'';
};

/**
 * Escape an array of strings
 * @param {string[]} data The data to escape
 * @return {string[]} An array of escaped strings
 */
var escapeArray = function (data) {
    var escaped = [];

    lo.forEach(data, function (d) {
        escaped.push(utils.escapeString(d));
    });

    return escaped;
};

/**
 * Maps the Id to the data
 * @param {array} sObjects The objects to map
 * @returns {object} A map of Id to object
 */
var idToObject = function (sObjects) {
    return lo.keyBy(sObjects, function (sObject) {
        return trimId(sObject.Id);
    });
};

/**
 * Runs and resolves a function with three parameters
 * @param {object} data The data
 * @param {string} key The key
 * @param {string} field The field
 * @param {function} func The function to run
 * @returns {Promise} A promise for the run
 */
function runFunc(data, key, field, func) {
    var deferred = Q.defer();

    deferred.resolve(func(data, key, field));

    return deferred.promise;
}

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
    return runFunc(data, key, limit, limitNoPromise);
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
 * Make sure that we acutally have logs to download
 * @param {objects[]} event_log_files The files to download
 * @returns {undefined}
 */
function ensureLogFilesExist(event_log_files) {
    if (lo.isEmpty(event_log_files)) {
        global.logger.error('Unable to find log files');
        process.exit(errorCodes.NO_LOGFILES);
    }
}

/**
 * Gets the log files we should be fetching
 * @param {objects[]} event_log_files The event log files to download
 * @returns {objects[]} The log files to download
 */
function getApplicableLogFiles(event_log_files) {
    if (global.config.latest) {
        return getMostRecentFiles(event_log_files);
    }

    return event_log_files;
}

/**
 * Concatenates all of the promise results together
 * @param {object[]} promise_results The results from the all settled promises
 * @param {object} deferred The Q defer
 * @returns {undefined}
 */
function concatenateResults(promise_results, deferred) {
    var errors = [];
    var results = [];

    lo.forEach(promise_results, function (result) {
        if (result.state === 'fulfilled') {
            results = lo.concat(results, result.value);
        } else {
            errors.push(result.reason);
        }
    });

    if (!lo.isEmpty(errors)) {
        deferred.reject(errors);
    } else {
        deferred.resolve(results);
    }
}

/**
 * Fetch and convert a list of log files
 * @param {array} event_log_files The event log files to download
 * @returns {Promise} A promise for the data from the event log files
 */
var fetchAndConvert = function (event_log_files) {
    var promises = [];
    var deferred = Q.defer();

    ensureLogFilesExist(event_log_files);
    var files = getApplicableLogFiles(event_log_files);

    lo.forEach(files, function (event_log_file) {
        promises.push(sfdc.fetchConvertFile(event_log_file));
    });

    Q.allSettled(promises)
        .then(function (promise_results) {
            concatenateResults(promise_results, deferred);
        }).catch(function (error) {
            deferred.reject(error);
        });

    return deferred.promise;
};

/**
 * Method to do the filtering
 * @param {object} filters The filters to apply
 * @returns {function} The predicate function
 */
function filterPredicate(filters) {
    return function (data) {
        var matches = true;

        lo.forEach(filters, function (filter, key) {
            if (filter === undefined) {
                return;
            }

            if (lo.isArray(filter)) {
                if (!lo.includes(filter, lo.get(data, key))) {
                    matches = false;
                }
            } else if (filter !== lo.get(data, key)) {
                matches = false;
            }
        });

        return matches;
    };
}

/**
 * Filters data
 * @param {object} data The data to filter
 * @param {string} key The key of the data to filter
 * @param {object} filter The filter to apply
 * @returns {object} The filtered data
 */
function filterNoPromise(data, key, filter) {
    var filtered_results = lo.filter(lo.get(data, key), filterPredicate(filter));

    lo.set(data, key, filtered_results);

    return data;
}

/**
 * Filters data
 * @param {object} data The data to filter
 * @param {string} key The key of the data to filter
 * @param {object} filter The filter to apply
 * @returns {object} The filtered data
 */
var filterResults = function (data, key, filter) {
    var deferred = Q.defer();

    deferred.resolve(filterNoPromise(data, key, filter));

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
    return runFunc(data, key, sorter, sortNoPromise);
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
            try {
                drow.push(global.helper.formatter(column, row[column]));
            } catch (error) {
                drow.push(output_info[column].formatter(row[column]));
            }
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
        if (lo.isEmpty(data)) {
            global.logger.log('No data to display');
        } else {
            global.logger.log(table(generateTableData(data, columns, output_info)));
        }
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
var outputJSONToConsole = function (data) {
    var deferred = Q.defer();

    global.logger.log(JSON.stringify(data));
    deferred.resolve();

    return deferred.promise;
};

var utils = {
    escapeString: escapeString,
    escapeArray: escapeArray,
    fetchAndConvert: fetchAndConvert,
    filterResults: filterResults,
    generateTableData: generateTableData,
    idToObject: idToObject,
    limitNoPromise: limitNoPromise,
    limitResults: limitResults,
    outputJSONToConsole: outputJSONToConsole,
    printFormattedData: printFormattedData,
    sortNoPromise: sortNoPromise,
    sortResults: sortResults,
    splitByField: splitByField,
    subLimitResults: subLimitResults,
    subSortResults: subSortResults,
    trimId: trimId,
    writeJSONtoFile: writeJSONtoFile
};

module.exports = utils;