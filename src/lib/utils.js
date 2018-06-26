var lo = require('lodash');
var Q = require('q');

var escapeString = function (data) {
    return '\'' + data.replace(/'/, '\\\'') + '\'';
};

var limitNoPromise = function(data, key, limit) {
    if (limit !== undefined) {
        global.logger.debug('Limiting to ' + limit);
        lo.set(data, key, lo.slice(lo.get(data, key), 0, limit));
    }

    return data;
};

function genericLimit(data, key, limit) {
    var deferred = Q.defer();

    deferred.resolve(limitNoPromise(data, key, limit));

    return deferred.promise;
}

var limitResults = function (data, key) {
    return genericLimit(data, key, global.config.limit);
};

var subLimitResults = function (data, key) {
    return genericLimit(data, key, global.config.sublimit);
};

var rejectResolve = function (deferred, error, data) {
    if (error) {
        deferred.reject(error);
    } else {
        deferred.resolve(data);
    }
};

var sortNoPromise = function(data, key, sorter) {
   global.logger.debug('Sorting by ' + sorter);
    lo.set(data, key, lo.sortBy(lo.get(data, key), lo.split(sorter, ',')).reverse());

    if (global.config.asc) {
        global.logger.debug('Ascending');

        lo.set(data, key, lo.get(data, key).reverse());
    }

    return data;
};

function genericSort(data, key, sorter) {
    var deferred = Q.defer();
 
    deferred.resolve(sortNoPromise(data, key, sorter));

    return deferred.promise;
}

var sortResults = function (data, key) {
    return genericSort(data, key, global.config.sort);
};

var subSortResults = function (data, key) {
    return genericSort(data, key, global.config.subsort);
};

var utils = {
    escapeString: escapeString,
    limitNoPromise: limitNoPromise,
    limitResults: limitResults,
    rejectResolve: rejectResolve,
    sortNoPromise: sortNoPromise,
    sortResults: sortResults,
    subLimitResults: subLimitResults,
    subSortResults: subSortResults
};

module.exports = utils;