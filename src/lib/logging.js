/**
 * Log an error
 * @param {Error} error The error
 * @returns {undefined}
 */
var logError = function (error) {
    global.logger.error(error);
};

/**
 * Logs and error message and exits
 * @param {string} message The error message
 * @param {number} error_code The error code to use
 * @returns {undefined}
 */
var logAndExit = function (message, error_code) {
    logError(message);
    process.exit(error_code);
};

module.exports = {
    logAndExit: logAndExit,
    logError: logError
};