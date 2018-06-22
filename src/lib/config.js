var commander = require('commander');
var ini = require('ini');
var fs = require('fs');
var lo = require('lodash');
var path = require('path');
var Q = require('q');

var pkg = require('../../package.json');

var SOLENOPSIS_FIELDS = [
    'username',
    'password',
    'token',
    'url'
];

function getUserHome() {
    'use strict';

    return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}

var loadSolenopsisCredentials = function (env) {
    'use strict';

    /*jslint stupid: true*/
    var solenopsis_config_path = path.join(getUserHome(), '.solenopsis/credentials/', env + '.properties'),
        sol_config = ini.parse(fs.readFileSync(solenopsis_config_path, 'utf-8'));
    /*jslint stupid: false*/

    lo.merge(global.config, lo.pick(sol_config, SOLENOPSIS_FIELDS));
};

var loadConfig = function () {
    'use strict';

    var deferred = Q.defer();

    fs.readFile(path.join(getUserHome(), '.eventmonitoring'), function (error, data) {
        if (error) {
            if (error.code === 'ENOENT') {
                deferred.resolve();
            } else {
                deferred.reject(error);
            }
        } else {
            lo.merge(global.config, JSON.parse(data));
            deferred.resolve();
        }
    });

    return deferred.promise;
};

var merge = function (args) {
    lo.merge(global.config, args);
};

var config = {
    loadSolenopsisCredentials: loadSolenopsisCredentials,
    loadConfig: loadConfig,
    merge: merge
};

module.exports = config;