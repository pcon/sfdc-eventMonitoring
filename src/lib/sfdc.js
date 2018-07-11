var Q = require('q');
var csvtojson = require('csvtojson');
var fs = require('fs');
var jsonfile = require('jsonfile');
var jsforce = require('jsforce');
var lo = require('lodash');
var path = require('path');
var process = require('process');
var request = require('request');

var conf = require('./config.js');
var errorCodes = require('./errorCodes.js');
var qutils = require('./qutils.js');

/**
 * Login to salesforce and write it to the global space
 * @returns {Promise} A promise for when the login completes
 */
var login = function () {
    if (global.config.url === undefined) {
        global.config.url = global.config.sandbox ? 'https://test.salesforce.com' : 'https://login.salesforce.com';
    }

    if (global.config.solenopsis) {
        if (global.config.env === undefined) {
            global.logger.error('No environment specified');
            process.exit(errorCodes.NO_ENVIRONMENT);
        }

        global.logger.debug('Loading solenopsis config for ' + global.config.env);
        conf.loadSolenopsisCredentials(global.config.env);
    }

    if (
        global.config.username === undefined ||
        global.config.password === undefined ||
        global.config.url === undefined
    ) {
        global.logger.error('Unable to login.  Incomplete credentials');
        process.exit(errorCodes.INCOMPLETE_CREDS);
    }

    var deferred = Q.defer();

    global.sfdc_conn = new jsforce.Connection({ loginUrl: global.config.url });

    var combined_password = global.config.token === undefined ? global.config.password : global.config.password + global.config.token;
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

    if (global.sfdc_conn === undefined) {
        global.logger.error('No valid connection');
        process.exit(errorCodes.NO_CONNECTION_QUERY);
    }

    global.logger.debug('Querying ' + query_string);

    global.sfdc_conn.query(query_string, function (error, results) {
        qutils.rejectResolve(deferred, error, lo.get(results, 'records'));
    });

    return deferred.promise;
};

/**
 * Gets the cache file name
 * @param {object} log The log file to generate a name for
 * @returns {string} The log file name
 */
function generateCacheFilename(log) {
    return path.join(global.config.cache, log.Id + '.json');
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
            results = [];

            if (global.sfdc_conn === undefined) {
                global.logger.error('No valid connection');
                process.exit(errorCodes.NO_CONNECTION_FETCH);
            }

            var options = {
                url: global.sfdc_conn.instanceUrl + log.LogFile,
                headers: { Authorization: 'Bearer ' + global.sfdc_conn.accessToken }
            };

            csvtojson()
                .fromStream(request.get(options))
                .subscribe(function (json) {
                    results.push(json);
                }).on('done', function (error) {
                    if (error) {
                        deferred.reject(error);
                    } else {
                        writeCachedLog(log, results)
                            .then(function () {
                                deferred.resolve(results);
                            }).catch(function (write_error) {
                                deferred.reject(write_error);
                            });
                    }
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