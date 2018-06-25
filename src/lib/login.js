var lo = require('lodash');

var utils = require('./utils.js');

var limitCounts = function (data) {
    return utils.limitResults(data, 'counts');
};

var sortCounts = function (data) {
    return utils.sortResults(data, 'counts');
};

var wasSuccessful = function (login_status) {
    return (login_status === 'LOGIN_NO_ERROR');
};

var login = {
    limitCounts: limitCounts,
    sortCounts: sortCounts,
    wasSuccessful: wasSuccessful
};

module.exports = login;