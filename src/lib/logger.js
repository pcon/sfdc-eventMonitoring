var debug = function (message) {
    if (global.config.debug) {
        console.log(message);
    }
};

var log = function (message) {
    console.info(message);
};

var error = function (message) {
    console.error(message);
};

var logger = {
    debug: debug,
    error: error,
    log: log
}

module.exports = logger;