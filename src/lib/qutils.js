var lo = require('lodash');
var Q = require('q');

/**
 * Gets all the fulfilled values
 * @param {object[]} results Results from the Q
 * @return {object} The errors and the results
 */
var splitResultValues = function (results) {
    var returnObj = {
        values: [],
        errors: []
    };

    lo.forEach(results, function (result) {
        if (result.state === 'fulfilled') {
            returnObj.values.push(result.value);
        } else {
            returnObj.errors.push(result.reason);
        }
    });

    return returnObj;
};

/**
 * Gets all the fulfilled values
 * @param {object[]} results Results from the Q
 * @return {object[]} All of the fulfilled values
 */
var getResultValues = function (results) {
    return splitResultValues(results).values;
};

/**
 * Gets all the errors
 * @param {object[]} results Results from the Q
 * @return {object[]} All of the errors
 */
var getResultErrors = function (results) {
    return splitResultValues(results).errors;
};

/**
 * Handle settled promises
 * @param {Promise[]} promises An array of promises
 * @param {function} func The function to run
 * @return {undefined}
 */
var handleSettled = function (promises, func) {
    Q.allSettled(promises)
        .then(func);
};

/**
 * When all the promises are settled create an array of the values and push them to the value_array_field
 * @param {object} deferred The Q deferred
 * @param {Promise[]} promises An array of promises
 * @returns {undefined}
 */
var allSettledPushArray = function (deferred, promises) {
    handleSettled(promises,function (results) {
        deferred.resolve(getResultValues(results));
    });
};

/**
 * When all the promises are settled create an array of the values and push them to the value_array_field
 * @param {object} deferred The Q deferred
 * @param {Promise[]} promises An array of promises
 * @param {object} grouping The grouping
 * @param {string} value_array_field The field that the array will be stored in
 * @returns {undefined}
 */
var allSettledPushValue = function (deferred, promises, grouping, value_array_field) {
    handleSettled(promises, function (results) {
        var value_array = getResultValues(results);
        var resolve_value = { grouping: grouping };

        lo.set(resolve_value, value_array_field, value_array);

        deferred.resolve(resolve_value);
    });
};

/**
 * When all the promises are settled reject if there are any errors
 * @param {object} deferred The Q deferred
 * @param {Promise[]} promises An array of promises
 * @returns {undefined}
 */
var allSettledRejectErrors = function (deferred, promises) {
    handleSettled(promises, function (results) {
        qutils.rejectResolve(deferred, getResultErrors(results), undefined);
    });
};

/**
 * Reject or resolve if there is an error
 * @param {object} deferred The deferred instance to reject/resolve
 * @param {error} error The error if there is one
 * @param {object} data The data to resolve if there is no error
 * @returns {undefined}
 */
var rejectResolve = function (deferred, error, data) {
    if (!lo.isEmpty(error)) {
        deferred.reject(error);
    } else {
        deferred.resolve(data);
    }
};

var qutils = {
    allSettledPushArray: allSettledPushArray,
    allSettledPushValue: allSettledPushValue,
    allSettledRejectErrors: allSettledRejectErrors,
    functions: {
        getResultErrors: getResultErrors,
        handleSettled: handleSettled,
        splitResultValues: splitResultValues
    },
    getResultValues: getResultValues,
    rejectResolve: rejectResolve
};

module.exports = qutils;