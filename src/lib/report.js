var chalk = require('chalk');
var lo = require('lodash');
var Q = require('q');

var generateTableData = function (rows, columns, output_info) {
    var drow = [], data = [];

    lo.forEach(columns, function (column) {
        drow.push(chalk.bold(output_info[column].header));
    });

    data.push(drow);

    lo.forEach(rows, function (row) {
        drow = [];
        lo.forEach(columns, function (column) {
            drow.push(output_info[column].formatter(row[column]));
        });
        data.push(drow);
    });

    return data;
};

var limitAverages = function (data) {
    var deferred = Q.defer();

    if (global.config.limit !== undefined) {
        global.logger.debug('Limiting to ' + global.config.limit);
        data.averages = lo.slice(data.averages, 0, global.config.limit);
    }

    deferred.resolve(data);

    return deferred.promise;
};

var initializeAverages = function (data, data_map) {
    lo.forEach(lo.keys(data_map), function (key) {
        data[key] = 0;
    });

    return data;
};

var sortAverages = function (data) {
    var deferred = Q.defer();

    global.logger.debug('Sorting by ' + global.config.sort);
    data.averages = lo.sortBy(data.averages, lo.split(global.config.sort, ',')).reverse();

    if (global.config.asc) {
        global.logger.debug('Ascending');

        data.averages = data.averages.reverse();
    }

    deferred.resolve(data);

    return deferred.promise;
};

var report = {
    generateTableData: generateTableData,
    limitAverages: limitAverages,
    initializeAverages: initializeAverages,
    sortAverages: sortAverages
};

module.exports = report;