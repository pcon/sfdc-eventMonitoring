var Q = require('q');
var lo = require('lodash');

var logging = require('../lib/logging.js');
var queries = require('../lib/queries.js');
var sfdc = require('../lib/sfdc.js');

/**
 * Modifies the data
 * @param {object} data The data to modify
 * @returns {Promise} A promise for when the modify is done
 */
var modifyData = function (data) {
    var deferred = Q.defer();

    deferred.resolve(lo.map(data, lo.partialRight(lo.pick, queries.constants.USER_FIELDS)));

    return deferred.promise;
};

/**
 * Prints the data out based on the format
 * @param {object} data The data to print
 * @returns {Promise} A promise for when the printing is done
 */
var printResults = function (data) {
    var deferred = Q.defer();

    global.printer.print(JSON.stringify(data));

    deferred.resolve(data);

    return deferred.promise;
};

/**
 * The stuff to run
 * @returns {undefined}
 */
var run = function () {
    'use strict';

    sfdc.query(queries.utils.userdump())
        .then(modifyData)
        .then(printResults)
        .catch(logging.logError);
};

var cli = {run: run};

module.exports = cli;