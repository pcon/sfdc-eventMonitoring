var jsforce = require('jsforce');
var jsonfile = require('jsonfile');
var Q = require('q');

jest.mock('fs', function () {
    return {
        readFile: function (filename, cb) { //eslint-disable-line require-jsdoc,no-unused-vars
            if (filename === 'errorfile') {
                cb({ code: 'EERROR' }, undefined);
            } else if (filename === 'unknownfile') {
                cb({ code: 'ENOENT' }, undefined);
            } else {
                cb(undefined, '{"env":"myenv"}');
            }
        },
        readFileSync: function () { // eslint-disable-line require-jsdoc
            return 'username=bob@example.com\npassword=bobrules\ntoken=abcd\nurl=https://login.salesforce.com';
        },
        stat: function (filename, cb) { // eslint-disable-line require-jsdoc
            if (filename === 'errorfile') {
                cb({ code: 'oh noes' });
            } else {
                cb();
            }
        },
        access: function (filename, constants, callback) { // eslint-disable-line require-jsdoc
            if (filename === '/tmp/1532854800000_abc.json') {
                callback('ERROR');
            } else {
                callback();
            }
        },
        constants: { R_OK: 0 }
    };
});

jest.mock('jsforce');
jest.mock('jsonfile');

var sfdc = require('../../src/lib/sfdc.js');
var statics = require('../../src/lib/statics.js');
var errorCodes = require('../../src/lib/errorCodes.js');
global.logger = require('../../src/lib/logger.js');

beforeEach(function () {
    jest.restoreAllMocks();
    global.config = {};
    global.sfdc_conn = undefined;
});

describe('Verify connection', function () {
    test('Invalid connection', function () {
        jest.spyOn(process, 'exit').mockImplementationOnce(function () {});
        jest.spyOn(console, 'error').mockImplementationOnce(function () {});

        global.sfdc_conn = undefined;

        sfdc.functions.verifyConnection();
        expect(process.exit).toHaveBeenCalledWith(errorCodes.NO_CONNECTION_QUERY);
        expect(console.error).toHaveBeenCalledWith('No valid connection'); // eslint-disable-line no-console
    });

    test('Valid connection', function () {
        jest.spyOn(process, 'exit').mockImplementationOnce(function () {});
        jest.spyOn(console, 'error').mockImplementationOnce(function () {});

        global.sfdc_conn = 'foo';

        sfdc.functions.verifyConnection();
        expect(process.exit).not.toHaveBeenCalled();
        expect(console.error).not.toHaveBeenCalled(); // eslint-disable-line no-console
    });
});

describe('Verify Solenopsis', function () {
    test('Invalid environment', function () {
        jest.spyOn(process, 'exit').mockImplementationOnce(function () {});
        jest.spyOn(console, 'error').mockImplementationOnce(function () {});

        sfdc.functions.verifySolenopsisEnvironment();
        expect(process.exit).toHaveBeenCalledWith(errorCodes.NO_ENVIRONMENT);
        expect(console.error).toHaveBeenCalledWith('No environment specified'); // eslint-disable-line no-console
    });

    test('Valid environment', function () {
        jest.spyOn(process, 'exit').mockImplementationOnce(function () {});
        jest.spyOn(console, 'error').mockImplementationOnce(function () {});

        global.config.env = 'foo';

        sfdc.functions.verifySolenopsisEnvironment();
        expect(process.exit).not.toHaveBeenCalled();
        expect(console.error).not.toHaveBeenCalled(); // eslint-disable-line no-console
    });
});

test('Get query options', function () {
    var expectedResults = {
        url: 'https://na7.salesforce.com/foo',
        headers: { Authorization: 'Bearer 123456' }
    };

    global.sfdc_conn = {
        instanceUrl: 'https://na7.salesforce.com',
        accessToken: '123456'
    };

    expect(sfdc.functions.getQueryOptions('/foo')).toEqual(expectedResults);
});

describe('Configure URL', function () {
    test('Prod', function () {
        sfdc.functions.configureURL();
        expect(global.config.url).toEqual(statics.CONNECTION.PROD_URL);
    });

    test('Sandbox', function () {
        global.config.sandbox = true;
        sfdc.functions.configureURL();
        expect(global.config.url).toEqual(statics.CONNECTION.SANDBOX_URL);
    });

    test('Override', function () {
        global.config.url = 'override';
        sfdc.functions.configureURL();
        expect(global.config.url).toEqual('override');
    });
});

describe('Configure version', function () {
    test('Unset version', function () {
        sfdc.functions.configureVersion();
        expect(global.config.version).toEqual(statics.CONNECTION.VERSION);
    });

    test('Set version', function () {
        global.config.version = '43.0';
        sfdc.functions.configureVersion();
        expect(global.config.version).toEqual('43.0');
    });
});

describe('Configure Solenopsis', function () {
    test('Not set', function () {
        sfdc.functions.configureSolenopsis();
        expect(global.config).toEqual({});
    });

    test('Set', function () {
        global.config = {
            solenopsis: true,
            env: 'prod'
        };

        var expectedResults = {
            solenopsis: true,
            env: 'prod',
            username: 'bob@example.com',
            password: 'bobrules',
            token: 'abcd',
            url: 'https://login.salesforce.com'
        };

        sfdc.functions.configureSolenopsis();
        expect(global.config).toEqual(expectedResults);
    });
});

describe('Check credentials', function () {
    test('Invalid', function () {
        jest.spyOn(process, 'exit').mockImplementationOnce(function () {});
        jest.spyOn(console, 'error').mockImplementationOnce(function () {});

        sfdc.functions.checkCredentials();
        expect(process.exit).toHaveBeenCalledWith(errorCodes.INCOMPLETE_CREDS);
        expect(console.error).toHaveBeenCalledWith('Unable to login.  Incomplete credentials'); // eslint-disable-line no-console
    });

    test('Valid', function () {
        jest.spyOn(process, 'exit').mockImplementationOnce(function () {});
        jest.spyOn(console, 'error').mockImplementationOnce(function () {});

        global.config = {
            username: 'a',
            password: 'b',
            url: 'c'
        };

        sfdc.functions.checkCredentials();
        expect(process.exit).not.toHaveBeenCalled();
        expect(console.error).not.toHaveBeenCalled(); // eslint-disable-line no-console
    });
});

test('Setup login', function () {
    global.config = {
        solenopsis: true,
        env: 'prod'
    };

    var expectedResults = {
        solenopsis: true,
        env: 'prod',
        username: 'bob@example.com',
        password: 'bobrules',
        token: 'abcd',
        url: 'https://login.salesforce.com',
        version: statics.CONNECTION.VERSION
    };

    sfdc.functions.setupLogin();
    expect(global.config).toEqual(expectedResults);
});

test('Generate filename', function () {
    var log = {
        Id: 'abc',
        LogDate: '2018-07-29T09:00:00.000Z'
    };
    global.config.cache = '/tmp/';

    expect(sfdc.functions.generateFilename(log, 'test')).toEqual('/tmp/1532854800000_abc.test');
});

test('Generate cache filename', function () {
    var log = {
        Id: 'abc',
        LogDate: '2018-07-29T09:00:00.000Z'
    };
    global.config.cache = '/tmp/';

    expect(sfdc.functions.generateCacheFilename(log)).toEqual('/tmp/1532854800000_abc.json');
});

test('Generate CSV filename', function () {
    var log = {
        Id: 'abc',
        LogDate: '2018-07-29T09:00:00.000Z'
    };
    global.config.cache = '/tmp/';

    expect(sfdc.functions.generateCSVFilename(log)).toEqual('/tmp/1532854800000_abc.csv');
});

describe('Get download strategy', function () {
    test('No cache', function () {
        expect(sfdc.functions.getDownloadStrategy()).toEqual(sfdc.functions.streamToMemory);
    });

    test('Cache', function () {
        global.config.cache = '/tmp/';
        expect(sfdc.functions.getDownloadStrategy()).toEqual(sfdc.functions.downloadToDiskAndConvert);
    });
});

describe('Login', function () {
    test('No Token', function () {
        global.config = {
            username: 'bob@example.com',
            password: 'abc'
        };

        jsforce.Connection.prototype.login.mockImplementation(function (username, password, callback) {
            expect(username).toEqual('bob@example.com');
            expect(password).toEqual('abc');
            callback(undefined);
        });

        expect.assertions(3);
        return sfdc.login().then(function () {
            expect(jsforce.Connection.prototype.login).toHaveBeenCalled();
        });
    });

    test('Token', function () {
        global.config = {
            username: 'bob@example.com',
            password: 'abc',
            token: '123'
        };

        jsforce.Connection.prototype.login.mockImplementation(function (username, password, callback) {
            expect(username).toEqual('bob@example.com');
            expect(password).toEqual('abc123');
            callback(undefined);
        });

        expect.assertions(3);
        return sfdc.login().then(function () {
            expect(jsforce.Connection.prototype.login).toHaveBeenCalled();
        });
    });

    test('Error', function () {
        global.config = {
            username: 'bob@example.com',
            password: 'abc',
            token: '123'
        };

        jsforce.Connection.prototype.login.mockImplementation(function (username, password, callback) {
            expect(username).toEqual('bob@example.com');
            expect(password).toEqual('abc123');
            callback('I AM ERROR');
        });

        expect.assertions(4);
        return sfdc.login().catch(function (error) {
            expect(jsforce.Connection.prototype.login).toHaveBeenCalled();
            expect(error).toEqual('I AM ERROR');
        });
    });
});

describe('Logout', function () {
    test('No connection', function () {
        global.sfdc_conn = undefined;

        jsforce.Connection.prototype.logout.mockImplementation(function (callback) {
            callback(undefined);
        });

        expect.assertions(1);
        return sfdc.logout().then(function () {
            expect(jsforce.Connection.prototype.logout).not.toHaveBeenCalled();
        });
    });

    test('Valid', function () {
        global.sfdc_conn = new jsforce.Connection();

        jsforce.Connection.prototype.logout.mockImplementation(function (callback) {
            callback(undefined);
        });

        expect.assertions(1);
        return sfdc.logout().then(function () {
            expect(jsforce.Connection.prototype.logout).toHaveBeenCalled();
        });
    });
});

describe('Query', function () {
    test('Invalid', function () {
        global.sfdc_conn = new jsforce.Connection();
        var query = 'select Id from EventMonitoring';

        jsforce.Connection.prototype.query.mockImplementation(function (query_string, callback) {
            expect(query_string).toEqual(query);
            callback('I AM ERROR', undefined);
        });

        expect.assertions(3);
        return sfdc.query(query).catch(function (error) {
            expect(jsforce.Connection.prototype.query).toHaveBeenCalled();
            expect(error).toEqual('I AM ERROR');
        });
    });

    test('Valid', function () {
        global.sfdc_conn = new jsforce.Connection();
        var query = 'select Id from EventMonitoring';

        jsforce.Connection.prototype.query.mockImplementation(function (query_string, callback) {
            expect(query_string).toEqual(query);
            callback(undefined, { records: [ 'abc', '123' ]});
        });

        expect.assertions(3);
        return sfdc.query(query).then(function (results) {
            expect(jsforce.Connection.prototype.query).toHaveBeenCalled();
            expect(results).toEqual([ 'abc', '123' ]);
        });
    });
});

describe('Get cached log', function () {
    test('No cache', function () {
        global.config.debug = true;
        global.sfdc_conn = new jsforce.Connection();
        var log = {
            Id: 'abc',
            LogDate: '2018-07-29T09:00:00.000Z'
        };

        jest.spyOn(console, 'log').mockImplementationOnce(function () {});

        expect.assertions(2);
        return sfdc.functions.getCachedLog(log).then(function (data) {
            expect(data).toBeUndefined();
            expect(console.log).toHaveBeenCalledWith('No cache folder set'); // eslint-disable-line no-console
        });
    });

    test('Invalid', function () {
        var log = {
            Id: 'abc',
            LogDate: '2018-07-29T09:00:00.000Z'
        };
        global.config.cache = '/tmp/';

        expect.assertions(1);
        return sfdc.functions.getCachedLog(log).then(function (data) {
            expect(data).toBeUndefined();
        });
    });

    test('Invalid read', function () {
        var log = {
            Id: 'def',
            LogDate: '2018-07-29T09:00:00.000Z'
        };
        global.config.cache = '/tmp/';

        jsonfile.readFile.mockImplementation(function (filename, cb) {
            expect(filename).toEqual('/tmp/1532854800000_def.json');
            cb('I AM ERROR', undefined);
        });

        expect.assertions(2);
        return sfdc.functions.getCachedLog(log).catch(function (error) {
            expect(error).toEqual('I AM ERROR');
        });
    });

    test('Valid read', function () {
        var log = {
            Id: 'def',
            LogDate: '2018-07-29T09:00:00.000Z'
        };
        global.config.cache = '/tmp/';

        jsonfile.readFile.mockImplementation(function (filename, cb) {
            expect(filename).toEqual('/tmp/1532854800000_def.json');
            cb(undefined, { foo: 'bar' });
        });

        expect.assertions(2);
        return sfdc.functions.getCachedLog(log).then(function (data) {
            expect(data).toEqual({ foo: 'bar' });
        });
    });
});

describe('Write cached log', function () {
    test('No cache', function () {
        global.config.debug = true;
        var log = {
            Id: 'abc',
            LogDate: '2018-07-29T09:00:00.000Z'
        };
        var data = [];

        jest.spyOn(console, 'log').mockImplementationOnce(function () {});

        expect.assertions(1);
        return sfdc.functions.writeCachedLog(log, data).then(function () {
            expect(console.log).toHaveBeenCalledWith('No cache folder set'); // eslint-disable-line no-console
        });
    });

    test('Invalid write', function () {
        var log = {
            Id: 'def',
            LogDate: '2018-07-29T09:00:00.000Z'
        };
        var data = [ 'a', 'b', 'c' ];
        global.config.cache = '/tmp/';
        global.config.debug = true;

        jest.spyOn(console, 'log').mockImplementation(function () {});

        jsonfile.writeFile.mockImplementation(function (filename, json_data, cb) {
            expect(json_data).toEqual(data);
            expect(filename).toEqual('/tmp/1532854800000_def.json');
            cb('I AM ERROR');
        });

        expect.assertions(3);
        return sfdc.functions.writeCachedLog(log, data).then(function () {
            expect(console.log).toHaveBeenCalledTimes(3); // eslint-disable-line no-console
        });
    });

    test('Valid read', function () {
        var log = {
            Id: 'def',
            LogDate: '2018-07-29T09:00:00.000Z'
        };
        global.config.cache = '/tmp/';
        var data = [ 'a', 'b', 'c' ];

        jsonfile.writeFile.mockImplementation(function (filename, json_data, cb) {
            expect(json_data).toEqual(data);
            expect(filename).toEqual('/tmp/1532854800000_def.json');
            cb(undefined);
        });

        expect.assertions(2);
        return sfdc.functions.writeCachedLog(log, data).then(function () {});
    });
});

test('Write cached log deferred', function () {
    var log = {
        Id: 'def',
        LogDate: '2018-07-29T09:00:00.000Z'
    };
    var data = [ 'a', 'b', 'c' ];
    var deferred = Q.defer();

    sfdc.functions.writeLogCachedLoggedDeferred(log, data, deferred);

    return expect(deferred.promise).resolves.toBe(data);
});