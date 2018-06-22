var prettyms = require('pretty-ms');
var prettybytes = require('pretty-bytes');

var nanoToMsToPretty = function (data) {
    return prettyms(data / 1000000);
};

var noop = function (data) {
    return data;
};

var percent = function (data) {
    return data + '%';
};

var formatter = {
    nanoToMsToPretty: nanoToMsToPretty,
    noop: noop,
    percent: percent,
    prettybytes: prettybytes,
    prettyms: prettyms
};

module.exports = formatter;