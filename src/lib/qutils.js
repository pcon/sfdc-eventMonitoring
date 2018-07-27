var lo = require('lodash');
var Q = require('q');

/**
 * When all the promises are settled create an array of the values and push them to the value_array_field
 * @param {object} deferred The Q deferred
 * @param {Promise[]} promises An array of promises
 * @param {object} grouping The grouping
 * @param {string} value_array_field The field that the array will be stored in
 * @returns {undefined}
 */
var allSettledPushValue = function (deferred, promises, grouping, value_array_field) {
    var value_array = [];

    Q.allSettled(promises)
        .then(function (results) {
            lo.forEach(results, function (result) {
                if (result.state === 'fulfilled') {
                    value_array.push(result.value);
                }
            });

            var resolve_value = { grouping: grouping };
            lo.set(resolve_value, value_array_field, value_array);
            deferred.resolve(resolve_value);
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
    allSettledPushValue: allSettledPushValue,
    rejectResolve: rejectResolve
};

module.exports = qutils;