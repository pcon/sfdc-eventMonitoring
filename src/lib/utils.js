var lo = require('lodash');
var Q = require('q');

var limitResults = function (data, key) {
    var deferred = Q.defer();

    if (global.config.limit !== undefined) {
        global.logger.debug('Limiting to ' + global.config.limit);
        lo.set(data, key, lo.slice(lo.get(data, key), 0, global.config.limit));
    }

    deferred.resolve(data);

    return deferred.promise;
};

var rejectResolve = function (deferred, error, data) {
    if (error) {
        deferred.reject(error);
    } else {
        deferred.resolve(data);
    }
};

var sortResults = function (data, key) {
    var deferred = Q.defer();

    global.logger.debug('Sorting by ' + global.config.sort);
    lo.set(data, key,lo.sortBy(lo.get(data, key), lo.split(global.config.sort, ',')).reverse());

    if (global.config.asc) {
        global.logger.debug('Ascending');

        lo.set(data, key, lo.get(data, key).reverse());
    }

    deferred.resolve(data);

    return deferred.promise;
};


var utils = {
    limitResults: limitResults,
    rejectResolve: rejectResolve,
    sortResults: sortResults
};

module.exports = utils;