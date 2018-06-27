var Q = require('q');
var csvtojson = require('csvtojson');
var jsforce = require('jsforce');
var lo = require('lodash');
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

    global.sfdc_conn.query(query_string, function (error, results) {
        qutils.rejectResolve(deferred, error, lo.get(results, 'records'));
    });

    return deferred.promise;
};

/**
 * Download the remote file and convert it to an object
 * @param {string} file_path The path to the file
 * @returns {Promise} A promise for the results
 */
var fetchConvertFile = function (file_path) {
    if (global.sfdc_conn === undefined) {
        global.logger.error('No valid connection');
        process.exit(errorCodes.NO_CONNECTION_FETCH);
    }

    var options = {
        url: global.sfdc_conn.instanceUrl + file_path,
        headers: { Authorization: 'Bearer ' + global.sfdc_conn.accessToken }
    };
    var results = [];
    var deferred = Q.defer();

    csvtojson()
        .fromStream(request.get(options))
        .subscribe(function (json) {
            results.push(json);
        }).on('done', function (error) {
            qutils.rejectResolve(deferred, error, results);
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