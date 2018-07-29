var Q = require('q');
var csvtojson = require('csvtojson');
var fs = require('fs');
var jsonfile = require('jsonfile');
var jsforce = require('jsforce');
var lo = require('lodash');
var moment = require('moment');
var path = require('path');
var prettybytes = require('pretty-bytes');
var request = require('request');

var config = require('./config.js');
var errorCodes = require('./errorCodes.js');
var logging = require('./logging.js');
var statics = require('./statics.js');
var qutils = require('./qutils.js');

/**
 * Verifies we have a connection
 * @returns {undefined}
 */
function verifyConnection() {
    if (global.sfdc_conn === undefined) {
        logging.logAndExit('No valid connection', errorCodes.NO_CONNECTION_QUERY);
    }
}

/**
 * Verifies that we have a solenopsis environment configured
 * @returns {undefined}
 */
function verifySolenopsisEnvironment() {
    if (config.isUndefined('env')) {
        logging.logAndExit('No environment specified', errorCodes.NO_ENVIRONMENT);
    }
}

/**
 * Gets the request options
 * @param {string} uri The URI to download
 * @returns {object} The options
 */
function getQueryOptions(uri) {
    return {
        url: global.sfdc_conn.instanceUrl + uri,
        headers: { Authorization: 'Bearer ' + global.sfdc_conn.accessToken }
    };
}

/**
 * If the url is undefined set it
 * @returns {undefined}
 */
function configureURL() {
    if (config.isUndefined('url')) {
        global.config.url = global.config.sandbox ? statics.CONNECTION.SANDBOX_URL : statics.CONNECTION.PROD_URL;
    }
}

/**
 * If the version is undefined set it
 * @returns {undefined}
 */
function configureVersion() {
    if (config.isUndefined('version')) {
        global.config.version = statics.CONNECTION.VERSION;
    }
}

/**
 * If we're using Solenopsis credentials get them
 * @returns {undefined}
 */
function configureSolenopsis() {
    if (global.config.solenopsis) {
        verifySolenopsisEnvironment();

        global.logger.debug('Loading solenopsis config for ' + global.config.env);
        config.loadSolenopsisCredentials(global.config.env);
    }
}

/**
 * Make sure that we have credentials set
 * @returns {undefined}
 */
function checkCredentials() {
    if (config.isUndefined([ 'username', 'password', 'url' ])) {
        logging.logAndExit('Unable to login.  Incomplete credentials', errorCodes.INCOMPLETE_CREDS);
    }
}

/**
 * Sets up and verifies login information
 * @returns {undefined}
 */
function setupLogin() {
    configureURL();
    configureVersion();
    configureSolenopsis();
    checkCredentials();
}

/**
 * Login to salesforce and write it to the global space
 * @returns {Promise} A promise for when the login completes
 */
var login = function () {
    setupLogin();

    var deferred = Q.defer();

    global.sfdc_conn = new jsforce.Connection({
        loginUrl: global.config.url,
        version: global.config.version
    });

    var combined_password = config.isUndefined('token') ? global.config.password : global.config.password + global.config.token;
    global.sfdc_conn.login(global.config.username, combined_password, function (error) {
        qutils.rejectResolve(deferred, error);
    });

    return deferred.promise;
};

/**
 * Logout of salesforce
 * @returns {Promise} A promise for when the logout completes
 */
var logout = function () {
    var deferred = Q.defer();
    if (global.sfdc_conn !== undefined) {
        global.sfdc_conn.logout(function (error) {
            qutils.rejectResolve(deferred, error);
        });
    } else {
        deferred.resolve();
    }

    return deferred.promise;
};

/**
 * Query salesforce
 * @param {string} query_string The query
 * @returns {Promise} A promise for the results
 */
var query = function (query_string) {
    var deferred = Q.defer();

    verifyConnection();

    global.logger.debug('Querying ' + query_string);

    global.sfdc_conn.query(query_string, function (error, results) {
        qutils.rejectResolve(deferred, error, lo.get(results, 'records'));
    });

    return deferred.promise;
};

/**
 * Generates a file name based on a log
 * @param {object} log The log file to generate a name for
 * @param {string} extension The file extension
 * @returns {string} The log file name
 */
function generateFilename(log, extension) {
    var timestamp = moment.utc(log.LogDate).format('x');
    return path.join(global.config.cache, timestamp + '_' + log.Id + '.' + extension);
}

/**
 * Gets the cache file name
 * @param {object} log The log file to generate a name for
 * @returns {string} The log file name
 */
function generateCacheFilename(log) {
    return generateFilename(log, 'json');
}

/**
 * Gets the csv file name
 * @param {object} log The log file to generate a name for
 * @returns {string} The csv log file name
 */
function generateCSVFilename(log) {
    return generateFilename(log, 'csv');
}

/**
 * Gets the log from cache (if it exists)
 * @param {object} log The log file to get from cache
 * @returns {Promise} A promise for the results
 */
function getCachedLog(log) {
    var deferred = Q.defer();

    if (lo.isEmpty(global.config.cache)) {
        global.logger.debug('No cache folder set');
        deferred.resolve(undefined);
    } else {
        var filename = generateCacheFilename(log);

        global.logger.debug('Trying to read cache file "' + filename + '"');

        fs.access(filename, fs.constants.R_OK, function (access_error) {
            if (access_error) {
                global.logger.debug('Unable to read cache file');
                deferred.resolve(undefined);
            } else {
                jsonfile.readFile(generateCacheFilename(log), function (read_error, data) {
                    qutils.rejectResolve(deferred, read_error, data);
                });
            }
        });
    }

    return deferred.promise;
}

/**
 * Writes the data to cache (if it exists)
 * @param {object} log The log file to generate the cache filename
 * @param {object[]} data The data to cache
 * @returns {Promise} A promise for when the cache is writte
 */
function writeCachedLog(log, data) {
    var deferred = Q.defer();

    if (lo.isEmpty(global.config.cache)) {
        global.logger.debug('No cache folder set');
        deferred.resolve();
    } else {
        var filename = generateCacheFilename(log);

        global.logger.debug('Writing cache for ' + lo.size(data) + ' records to "' + filename + '"');

        jsonfile.writeFile(filename, data, function (error) {
            if (error) {
                global.logger.debug('Unable to write cache file');
                global.logger.debug(error.Error);
            }

            deferred.resolve();
        });
    }

    return deferred.promise;
}

/**
 * Use a given deferred to write the cached logs
 * @param {object} log The log file to write
 * @param {object} data The data to write
 * @param {object} deferred The Q.defer
 * @returns {undefined}
 */
function writeLogCachedLoggedDeferred(log, data, deferred) {
    writeCachedLog(log, data)
        .then(function () {
            deferred.resolve(data);
        }).catch(function (write_error) {
            deferred.reject(write_error);
        });
}

/**
 * Stream the data from the URL to csvtojson and keep it all in memory
 * @param {object} log The log to download
 * @param {object} options The request options
 * @returns {Promise} A promise for the results
 */
function streamToMemory(log, options) {
    var deferred = Q.defer();
    var results = [];

    csvtojson()
        .fromStream(request.get(options))
        .subscribe(function (json) {
            results.push(json);
        }, function (error) {
            deferred.reject(error);
        }).on('error', function (error) {
            deferred.reject(error);
        }).on('done', function (error) {
            if (error) {
                deferred.reject(error);
            } else {
                writeLogCachedLoggedDeferred(log, results, deferred);
            }
        });

    return deferred.promise;
}

/**
 * Write the data from the URL to disk and then convert it into memory
 * @param {object} log The log to download
 * @param {object} options The request options
 * @returns {Promise} A promise for the results
 */
function downloadToDiskAndConvert(log, options) {
    var deferred = Q.defer();
    var csvfilename = generateCSVFilename(log);
    var csvfile = fs.createWriteStream(csvfilename);

    request.get(options)
        .pipe(csvfile)
        .on('error', function (error) {
            deferred.reject(error);
        }).on('finish', function () {
            csvtojson()
                .fromFile(csvfilename)
                .then(function (results) {
                    writeLogCachedLoggedDeferred(log, results, deferred);
                });
        });

    return deferred.promise;
}

/**
 * Gets the type of download strategy to use
 * @returns {function} The download strategy to use
 */
function getDownloadStrategy() {
    if (lo.isEmpty(global.config.cache)) {
        return streamToMemory;
    }

    return downloadToDiskAndConvert;
}

/**
 * Download the remote file and convert it to an object
 * @param {object} log The log file to fetch and convert
 * @returns {Promise} A promise for the results
 */
var fetchConvertFile = function (log) {
    var deferred = Q.defer();
    getCachedLog(log).then(function (results) {
        if (results !== undefined) {
            deferred.resolve(results);
        } else {
            verifyConnection();

            global.logger.debug('Downloading ' + log.LogFile + ' (' + prettybytes(log.LogFileLength) + ')');

            var options = getQueryOptions(log.LogFile);
            var methodType = getDownloadStrategy();

            methodType(log, options)
                .then(function (data) {
                    deferred.resolve(data);
                }).catch(function (error) {
                    deferred.reject(error);
                });
        }
    }).catch(function (error) {
        deferred.reject(error);
    });

    return deferred.promise;
};

var sfdc = {
    fetchConvertFile: fetchConvertFile,
    login: login,
    logout: logout,
    query: query
};

module.exports = sfdc;