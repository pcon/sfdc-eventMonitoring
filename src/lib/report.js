var lo = require('lodash');
var Q = require('q');

var utils = require('./utils.js');

/**
 * Generates the averages for a single group
 * @param {array} logs The logs
 * @param {string} name The name
 * @param {object} data_map A map of field name to data name
 * @param {object} additional_data Additonal data to add to the averages
 * @return {promise} A promise for an average for the group
 */
var generateGroupAverage = function (logs, name, data_map, additional_data) {
    var deferred = Q.defer();
    var averages = {
        name: name,
        count: lo.size(logs)
    };

    averages = lo.merge(averages, additional_data);
    averages = report.initializeAverages(averages, data_map);

    lo.forEach(logs, function (log) {
        lo.forEach(data_map, function (value, key) {
            averages[key] += parseInt(log[value]);
        });
    });

    lo.forEach(data_map, function (value, key) {
        averages[key] /= lo.size(logs);
        averages[key] = Number(averages[key].toFixed(2));
    });

    deferred.resolve(averages);

    return deferred.promise;
};

/**
 * Intiializes all of the average fields
 * @param {object} data The data
 * @param {object} data_map Used for it's keys to know what to initialize
 * @returns {object} The updated data
 */
var initializeAverages = function (data, data_map) {
    lo.forEach(lo.keys(data_map), function (key) {
        data[key] = 0;
    });

    return data;
};

/**
 * Limit the averages
 * @param {object} data The data
 * @return {Promise} A promise for limited data
 */
var limitAverages = function (data) {
    return utils.limitResults(data, 'averages');
};

/**
 * Sort the averages
 * @param {object} data The data
 * @return {Promise} A promise for sorted data
 */
var sortAverages = function (data) {
    return utils.sortResults(data, 'averages');
};

var report = {
    generateGroupAverage: generateGroupAverage,
    initializeAverages: initializeAverages,
    limitAverages: limitAverages,
    sortAverages: sortAverages
};

module.exports = report;