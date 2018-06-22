var rejectResolve = function (deferred, error, data) {
    if (error) {
        deferred.reject(error);
    } else {
        deferred.resolve(data);
    }
};

var utils = {
    rejectResolve: rejectResolve
};

module.exports = utils;