var lo = require('lodash');
var path = require('path');
var Q = require('q');

var conf = require('./lib/config.js');
var logging = require('./lib/logging.js');
var sfdc = require('./lib/sfdc.js');
var statics = require('./lib/statics.js');
var queries = require('./lib/queries.js');
var utils = require('./lib/utils.js');

/**
 * Configure the module
 * @param {object} yargs The arguments
 * @returns {undefined}
 */
function config(yargs) {
    'use strict';

    yargs.options({
        'format': {
            default: 'json',
            describe: 'The output format to use',
            type: 'string',
            hidden: true,
            choices: [ 'json' ]
        },
        'type': {
            default: undefined,
            describe: 'The log type to dump',
            type: 'string',
            choices: statics.LOG_TYPES
        },
        'split': {
            default: false,
            describe: 'The output should be split into multiple files'
        },
        'file': {
            default: undefined,
            describe: 'The file to save to.  If unset, output will be sent to stdout',
            type: 'string'
        }
    });
}

/**
 * Returns the requested format
 * @returns {string} The requested format
 */
function getFormat() {
    return global.config.format !== undefined ? global.config.format : 'json';
}

/**
 * Are we suppose to be returning json
 * @returns {boolean} If the requested format is json
 */
function isJSON() {
    return getFormat() === 'json';
}

/**
 * Get all the logs that are requested
 * @returns {Promise} A promise for the event logs
 */
function queryLogs() {
    var query = queries.general.getAllLogs(global.config.type);

    return sfdc.query(query);
}

/**
 * Download the log files
 * @param {array} event_log_files The log files to download
 * @returns {Promise} A promise for all the log file contents
 */
function downloadLogs(event_log_files) {
    if (isJSON()) {
        return utils.fetchAndConvert(event_log_files);
    }

    var deferred = Q.defer();

    deferred.reject(new Error('Unhandled output format'));

    return deferred.promise;
}

/**
 * Generates a filename for a type
 * @param {string} filename The filename
 * @param {string} type The type
 * @returns {string} The new filename
 */
function generateFilename(filename, type) {
    var p = path.parse(filename);
    p.name = p.name + '_' + type;
    p.base = p.name + p.ext;

    return path.format(p);
}

/**
 * Splits the logs and writes them to multiple files
 * @param {array} logs The logs to write
 * @returns {Promise} A promise for when the logs have been written
 */
function splitLogsAndWrite(logs) {
    var deferred = Q.defer();
    var promises = [];
    var split_logs = utils.splitByField(logs, 'EVENT_TYPE');

    lo.forEach(split_logs, function (logs, type) {
        promises.push(utils.writeJSONtoFile(logs, generateFilename(global.config.file, type)));
    });

    Q.allSettled(promises)
        .then(function () {
            deferred.resolve();
        })
        .catch(function (error) {
            deferred.reject(error);
        });

    return deferred.promise;
}

/**
 * Output the logs
 * @param {array} logs The logs to output
 * @returns {Promise} A promise for when the data has been outputted
 */
function outputLogs(logs) {
    if (isJSON()) {
        if (global.config.file) {
            if (global.config.split) {
                return splitLogsAndWrite(logs);
            } else {
                return utils.writeJSONtoFile(logs, global.config.file);
            }
        } else {
            return utils.outputJSONToConsole(logs);
        }
    }

    var deferred = Q.defer();

    deferred.reject(new Error('Unhandled output format'));

    return deferred.promise;
}

/**
 * The run method
 * @param {object} args The arguments passed to the method
 * @returns {undefined}
 */
function run(args) {
    conf.merge(args);

    sfdc.login()
        .then(queryLogs)
        .then(downloadLogs)
        .then(outputLogs)
        .catch(logging.logError);
}

var cli = {
    config: config,
    run: run
};

module.exports = cli;