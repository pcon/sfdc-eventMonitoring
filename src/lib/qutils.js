/**
 * Reject or resolve if there is an error
 * @param {object} deferred The deferred instance to reject/resolve
 * @param {error} error The error if there is one
 * @param {object} data The data to resolve if there is no error
 * @returns {undefined}
 */
var rejectResolve = function (deferred, error, data) {
    if (error) {
        deferred.reject(error);
    } else {
        deferred.resolve(data);
    }
};

var qutils = { rejectResolve: rejectResolve };

module.exports = qutils;