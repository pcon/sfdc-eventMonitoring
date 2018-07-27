var lo = require('lodash');
var Q = require('q');

var sfdc = require('./sfdc.js');
var utils = require('./utils.js');

/**
 * Limit the results
 * @param {object} data The data to limit
 * @returns {Promise} A promise with limited results
 */
var limitCounts = function (data) {
    return utils.limitResults(data, 'counts');
};

/**
 * Generates counts for a grouping using a provided function
 * @param {object} grouping The grouping
 * @param {function} count_func The counting function
 * @return {Promise} A promise for when the counting is complete
 */
var generateCounts = function (grouping, count_func) {
    var promises = [];
    var counts = [];
    var deferred = Q.defer();

    lo.forEach(grouping, function (subgrouping, subgrouping_key) {
        lo.forEach(subgrouping, function (logs, key) {
            promises.push(count_func(logs, subgrouping_key, key));
        });
    });

    Q.allSettled(promises)
        .then(function (results) {
            lo.forEach(results, function (result) {
                if (result.state === 'fulfilled') {
                    counts.push(result.value);
                }
            });

            deferred.resolve({
                grouping: grouping,
                counts: counts
            });
        });

    return deferred.promise;
};

/**
* Run our login code
* @param {object} options The options
* @returns {undefined}
*/
var run = function (options) {
    sfdc.query(options.query)
        .then(utils.fetchAndConvert)
        .then(options.groupBy)
        .then(options.generateCounts)
        .then(sortCounts)
        .then(limitCounts)
        .then(options.printCounts)
        .catch(function (error) {
            global.logger.error(error);
        });
};

/**
 * Sort the results
 * @param {object} data The data to sort
 * @returns {Promise} A promise with sorted results
 */
var sortCounts = function (data) {
    return utils.sortResults(data, 'counts');
};

/**
 * If the login was successful
 * @param {string} login_status The login status
 * @return {bool} If it is a successful login
 */
var wasSuccessful = function (login_status) {
    return login_status === 'LOGIN_NO_ERROR';
};

var login = {
    limitCounts: limitCounts,
    generateCounts: generateCounts,
    run: run,
    sortCounts: sortCounts,
    wasSuccessful: wasSuccessful
};

module.exports = login;