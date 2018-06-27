var utils = require('./utils.js');

/**
 * Limit the results
 * @param {object} data The data to limit
 * @returns {Promise} A promise with limited results
 */
var limitCounts = function (data) {
    return utils.limitResults(data, 'counts');
};

/**
 * Sort the results
 * @param {object} data The data to sort
 * @returns {Promise} A promise with sorted results
 */
var sortCounts = function (data) {
    return utils.sortResults(data, 'counts');
};

/**
 * If the login was successful
 * @param {string} login_status The login status
 * @return {bool} If it is a successful login
 */
var wasSuccessful = function (login_status) {
    return login_status === 'LOGIN_NO_ERROR';
};

var login = {
    limitCounts: limitCounts,
    sortCounts: sortCounts,
    wasSuccessful: wasSuccessful
};

module.exports = login;