var Q = require('q');
var csvtojson = require('csvtojson');
var jsforce = require('jsforce');
var lo = require('lodash');
var process = require('process');
var request = require('request');

var conf = require('./config.js');
var logger = require('./logger.js');
var utils = require('./utils.js');

var login = function () {
    if (global.config.url === undefined) {
        global.config.url = (global.config.sandbox) ? 'https://test.salesforce.com' : 'https://login.salesforce.com';
    }

    if (global.config.solenopsis) {
        if (global.config.env === undefined) {
            logger.error('Environment specified');
            process.exit(-1);
        }

        logger.debug('Loading solenopsis config for ' + global.config.env);
        conf.loadSolenopsisCredentials(global.config.env);
    }

    if (
        global.config.username === undefined ||
        global.config.password === undefined ||
        global.config.url === undefined
    ) {
        logger.error('Unable to login.  Incomplete credentials');
        process.exit(-1);
    }

    var deferred = Q.defer();

    global.sfdc_conn = new jsforce.Connection({
        loginUrl: global.config.url
    });

    var combined_password = (global.config.token === undefined) ? global.config.password : global.config.password + global.config.token;
    global.sfdc_conn.login(global.config.username, combined_password, function (error) {
        utils.rejectResolve(deferred, error);
    });

    return deferred.promise;
};

var logout = function () {
    var deferred = Q.defer();
    if (global.sfdc_conn !== undefined) {
        global.sfdc_conn.logout(function (error) {
            utils.rejectResolve(deferred, error);
        });
    } else {
        deferred.resolve();
    }

    return deferred.promise;
}

var query = function (query_string) {
    var deferred = Q.defer();

    if (global.sfdc_conn === undefined) {
        logger.error('No valid connection');
        process.exit(-1);
    }

    global.sfdc_conn.query(query_string, function (error, results) {
        utils.rejectResolve(deferred, error, lo.get(results, 'records'));
    });

    return deferred.promise;
};

var fetchConvertFile = function (file_path) {
    if (global.sfdc_conn === undefined) {
        logger.error('No valid connection');
        process.exit(-1);
    }

    var options = {
        url: global.sfdc_conn.instanceUrl + file_path,
        headers: {
            Authorization: 'Bearer ' + global.sfdc_conn.accessToken
        }
    },
    results = [],
    deferred = Q.defer();

    csvtojson()
        .fromStream(request.get(options))
        .subscribe(function (json) {
            results.push(json);
        }).on('done', function (error) {
            utils.rejectResolve(deferred, error, results);
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