/* eslint no-console: ["error", { allow: ["log", "info", "error" ]}] */

/**
 * Sets the logger function if it doesn't exist
 * @returns {undefined}
 */
var setLoggerFunction = function () {
    if (global.loggerfunction === undefined) {
        global.loggerfunction = console;
    }
};

/**
 * Log the message to 'log'
 * @param {string} message The message to log
 * @returns {undefined}
 */
var debug = function (message) {
    setLoggerFunction();

    if (
        global.config !== undefined &&
        global.config.debug
    ) {
        global.loggerfunction.debug(message);
    }
};

/**
 * Log the message to 'info'
 * @param {string} message The message to log
 * @returns {undefined}
 */
var log = function (message) {
    global.loggerfunction.info(message);
};

/**
 * Log the message to 'error'
 * @param {string} message The message to log
 * @returns {undefined}
 */
var error = function (message) {
    setLoggerFunction();

    global.loggerfunction.error(message);
};

var logger = {
    debug: debug,
    error: error,
    log: log,
    setLoggerFunction: setLoggerFunction
};

module.exports = logger;