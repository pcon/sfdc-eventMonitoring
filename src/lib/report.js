var chalk = require('chalk');
var lo = require('lodash');
var Q = require('q');

var utils = require('./utils.js');

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
    return utils.limitResults(data, 'averages');
};

var initializeAverages = function (data, data_map) {
    lo.forEach(lo.keys(data_map), function (key) {
        data[key] = 0;
    });

    return data;
};

var sortAverages = function (data) {
    return utils.sortResults(data, 'averages');
};

var report = {
    generateTableData: generateTableData,
    limitAverages: limitAverages,
    initializeAverages: initializeAverages,
    sortAverages: sortAverages
};

module.exports = report;