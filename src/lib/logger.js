/* eslint no-console: ["error", { allow: ["log", "info", "error" ]}] */

/**
 * Log the message to 'log'
 * @param {string} message The message to log
 * @returns {undefined}
 */
var debug = function (message) {
    if (
        global.config !== undefined &&
        global.config.debug
    ) {
        console.log(message);
    }
};

/**
 * Log the message to 'info'
 * @param {string} message The message to log
 * @returns {undefined}
 */
var log = function (message) {
    console.info(message);
};

/**
 * Log the message to 'error'
 * @param {string} message The message to log
 * @returns {undefined}
 */
var error = function (message) {
    console.error(message);
};

var logger = {
    debug: debug,
    error: error,
    log: log
};

module.exports = logger;