/* eslint no-console: ["error", { allow: ["log", "info", "error" ]}] */

/**
 * Print the message
 * @param {string} message The message to print
 * @returns {undefined}
 */
var print = function (message) {
    console.info(message);
};

var printer = { print: print };

module.exports = printer;