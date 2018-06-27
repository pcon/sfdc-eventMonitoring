var lo = require('lodash');

var utils = require('./utils.js');

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
    initializeAverages: initializeAverages,
    limitAverages: limitAverages,
    sortAverages: sortAverages
};

module.exports = report;