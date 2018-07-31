var chalk = require('chalk');
var Q = require('q');

const { table } = require('table');

var utils = require('../../src/lib/utils.js');
var errorCodes = require('../../src/lib/errorCodes.js');
global.logger = require('../../src/lib/logger.js');

describe('Trim id', function () {
    test('Undefined', function () {
        expect(utils.trimId(undefined)).toBeUndefined();
    });

    test('15 character id', function () {
        expect(utils.trimId('abcdefghijklmno')).toEqual('abcdefghijklmno');
    });

    test('18 character id', function () {
        expect(utils.trimId('abcdefghijklmnopqr')).toEqual('abcdefghijklmno');
    });
});

test('Escape string', function () {
    expect(utils.escapeString('It\'s a trap!')).toEqual('\'It\\\'s a trap!\'');
});

test('Escape array', function () {
    var entries = [
        'It\'s a trap!',
        'Why you got to player hate on IG-88'
    ];

    var expectedResults = [
        '\'It\\\'s a trap!\'',
        '\'Why you got to player hate on IG-88\''
    ];
    expect(utils.escapeArray(entries)).toEqual(expectedResults);
});

test('Id to object', function () {
    var objects = [
        {
            Id: '123456789012345',
            Field: 'IG-88'
        },
        {
            Id: 'abcdefghijklmnopqr',
            Field: 'Boba Fett'
        }
    ];

    var expectedResults = {
        '123456789012345': {
            Id: '123456789012345',
            Field: 'IG-88'
        },
        abcdefghijklmno: {
            Id: 'abcdefghijklmnopqr',
            Field: 'Boba Fett'
        }
    };

    expect(utils.idToObject(objects)).toEqual(expectedResults);
});

test('Run function', function () {
    var func = jest.fn();

    utils.runFunc('data', 'key', 'field', func);
    expect(func).toHaveBeenCalledWith('data', 'key', 'field');
});

describe('Limiting', function () {
    test('No promise, no limit', function () {
        var data = { values: [ 1, 2, 3, 4, 5 ] };
        expect(utils.limitNoPromise(data, 'values', undefined)).toEqual(data);
    });

    test('No promise, with limit', function () {
        var data = { values: [ 1, 2, 3, 4, 5 ] };
        var expectedResults = { values: [ 1, 2, 3 ] };
        expect(utils.limitNoPromise(data, 'values', 3)).toEqual(expectedResults);
    });

    test('No limit', function () {
        global.config = {};
        var data = { values: [ 1, 2, 3, 4, 5 ] };
        expect.assertions(1);
        return utils.limitResults(data, 'values').then(function (results) {
            expect(results).toEqual(data);
        });
    });

    test('With limit', function () {
        global.config = { limit: 3 };
        var data = { values: [ 1, 2, 3, 4, 5 ] };
        var expectedResults = { values: [ 1, 2, 3 ] };
        expect.assertions(1);
        return utils.limitResults(data, 'values').then(function (results) {
            expect(results).toEqual(expectedResults);
        });
    });

    test('No limit', function () {
        global.config = {};
        var data = { values: [ 1, 2, 3, 4, 5 ] };
        expect.assertions(1);
        return utils.subLimitResults(data, 'values').then(function (results) {
            expect(results).toEqual(data);
        });
    });

    test('With limit', function () {
        global.config = { sublimit: 3 };
        var data = { values: [ 1, 2, 3, 4, 5 ] };
        var expectedResults = { values: [ 1, 2, 3 ] };
        expect.assertions(1);
        return utils.subLimitResults(data, 'values').then(function (results) {
            expect(results).toEqual(expectedResults);
        });
    });
});

describe('Get log files', function () {
    test('Most recent files', function () {
        global.config = { latest: true };
        var files = [
            {
                EventType: 'Login',
                LogDate: '2014-02-25T01:30:00.000Z'
            },
            {
                EventType: 'ApexSoap',
                LogDate: '1984-07-17T14:00:00.000Z'
            },
            {
                EventType: 'Login',
                LogDate: '2018-07-29T07:38:00.000Z'
            },
            {
                EventType: 'ApexSoap',
                LogDate: '1984-04-21T13:00:00.000Z'
            }
        ];
        var expectedResults = {
            Login: {
                EventType: 'Login',
                LogDate: '2018-07-29T07:38:00.000Z'
            },
            ApexSoap: {
                EventType: 'ApexSoap',
                LogDate: '1984-07-17T14:00:00.000Z'
            }
        };
        expect(utils.getApplicableLogFiles(files)).toEqual(expectedResults);
    });

    test('All files', function () {
        global.config = { latest: false };
        var files = [
            {
                EventType: 'Login',
                LogDate: '2014-02-25T01:30:00.000Z'
            },
            {
                EventType: 'ApexSoap',
                LogDate: '1984-07-17T14:00:00.000Z'
            },
            {
                EventType: 'Login',
                LogDate: '2018-07-29T07:38:00.000Z'
            },
            {
                EventType: 'ApexSoap',
                LogDate: '1984-04-21T13:00:00.000Z'
            }
        ];
        expect(utils.getApplicableLogFiles(files)).toEqual(files);
    });
});

describe('Ensure log files exist', function () {
    test('They do', function () {
        jest.spyOn(process, 'exit').mockImplementationOnce(function () {});
        jest.spyOn(console, 'error').mockImplementationOnce(function () {});

        utils.ensureLogFilesExist([ 'foo' ]);

        expect(process.exit).not.toHaveBeenCalled();
        expect(console.error).not.toHaveBeenCalled(); // eslint-disable-line no-console
    });

    test('They do not', function () {
        jest.spyOn(process, 'exit').mockImplementationOnce(function () {});
        jest.spyOn(console, 'error').mockImplementationOnce(function () {});

        utils.ensureLogFilesExist([]);

        expect(process.exit).toHaveBeenCalledWith(errorCodes.NO_LOGFILES);
        expect(console.error).toHaveBeenCalledWith('Unable to find log files'); // eslint-disable-line no-console
    });
});

describe('Concatenate results', function () {
    test('No errors', function () {
        var data = [
            {
                state: 'fulfilled',
                value: 'foo'
            },
            {
                state: 'fulfilled',
                value: 'bar'
            }
        ];
        var expectedResults = [ 'foo', 'bar' ];

        var deferred = Q.defer();

        utils.concatenateResults(data, deferred);

        expect.assertions(1);
        return deferred.promise.then(function (results) {
            expect(results).toEqual(expect.arrayContaining(expectedResults));
        });
    });

    test('Has errors', function () {
        var data = [
            {
                state: 'fulfilled',
                value: 'foo'
            },
            {
                state: 'unfulfilled',
                reason: 'bar'
            }
        ];
        var expectedResults = [ 'bar' ];

        var deferred = Q.defer();

        utils.concatenateResults(data, deferred);

        expect.assertions(1);
        return deferred.promise.catch(function (error) {
            expect(error).toEqual(expectedResults);
        });
    });
});

describe('Filter data', function () {
    test('Undefined', function () {
        var data = { values: [
            { field: 'foo' },
            { field: 'bar' },
            { field: 'baz' }
        ] };

        var expectedResults = { values: [
            { field: 'foo' },
            { field: 'bar' },
            { field: 'baz' }
        ] };

        expect(utils.filterNoPromise(data, 'values', undefined)).toEqual(expectedResults);
    });

    test('Array', function () {
        var data = { values: [
            { field: 'foo' },
            { field: 'bar' },
            { field: 'baz' }
        ] };

        var expectedResults = { values: [
            { field: 'foo' },
            { field: 'baz' }
        ] };

        var filter = { field: [ 'foo', 'baz' ] };

        expect(utils.filterNoPromise(data, 'values', filter)).toEqual(expectedResults);
    });

    test('Single', function () {
        var data = { values: [
            { field: 'foo' },
            { field: 'bar' },
            { field: 'baz' }
        ] };

        var expectedResults = { values: [ { field: 'bar' } ] };

        var filter = { field: 'bar' };

        expect(utils.filterNoPromise(data, 'values', filter)).toEqual(expectedResults);
    });
});

describe('Sort', function () {
    test('Single desc', function () {
        global.config = {};

        var data = { values: [
            {
                field1: 'b',
                field2: 4
            },
            {
                field1: 'b',
                field2: 2
            },
            {
                field1: 'a',
                field2: 3
            },
            {
                field1: 'c',
                field2: 1
            }
        ] };

        var expectedResults = { values: [
            {
                field1: 'c',
                field2: 1
            },
            {
                field1: 'b',
                field2: 2
            },
            {
                field1: 'b',
                field2: 4
            },
            {
                field1: 'a',
                field2: 3
            }
        ] };

        expect(utils.sortNoPromise(data, 'values', 'field1')).toEqual(expectedResults);
    });

    test('Single asc', function () {
        global.config = { asc: true };

        var data = { values: [
            {
                field1: 'b',
                field2: 4
            },
            {
                field1: 'b',
                field2: 2
            },
            {
                field1: 'a',
                field2: 3
            },
            {
                field1: 'c',
                field2: 1
            }
        ] };

        var expectedResults = { values: [
            {
                field1: 'a',
                field2: 3
            },
            {
                field1: 'b',
                field2: 4
            },
            {
                field1: 'b',
                field2: 2
            },
            {
                field1: 'c',
                field2: 1
            }
        ] };

        expect(utils.sortNoPromise(data, 'values', 'field1')).toEqual(expectedResults);
    });

    test('Multiple desc', function () {
        global.config = {};

        var data = { values: [
            {
                field1: 'b',
                field2: 4
            },
            {
                field1: 'b',
                field2: 2
            },
            {
                field1: 'a',
                field2: 3
            },
            {
                field1: 'c',
                field2: 1
            }
        ] };

        var expectedResults = { values: [
            {
                field1: 'c',
                field2: 1
            },
            {
                field1: 'b',
                field2: 4
            },
            {
                field1: 'b',
                field2: 2
            },
            {
                field1: 'a',
                field2: 3
            }
        ] };

        expect(utils.sortNoPromise(data, 'values', [ 'field1', 'field2' ])).toEqual(expectedResults);
    });

    test('Multiple asc', function () {
        global.config = { asc: true };

        var data = { values: [
            {
                field1: 'b',
                field2: 4
            },
            {
                field1: 'b',
                field2: 2
            },
            {
                field1: 'a',
                field2: 3
            },
            {
                field1: 'c',
                field2: 1
            }
        ] };

        var expectedResults = { values: [
            {
                field1: 'a',
                field2: 3
            },
            {
                field1: 'b',
                field2: 2
            },
            {
                field1: 'b',
                field2: 4
            },
            {
                field1: 'c',
                field2: 1
            }
        ] };

        expect(utils.sortNoPromise(data, 'values', [ 'field1', 'field2' ])).toEqual(expectedResults);
    });
});

describe('Generate table data', function () {
    test('No custom formatter', function () {
        var noop = jest.fn().mockImplementation(function (data) {
            return data;
        });
        var numform = jest.fn().mockImplementation(function (data) {
            return '#' + data;
        });

        var rows = [
            {
                name: 'a',
                count: 1
            },
            {
                name: 'b',
                count: 2
            }
        ];

        var columns = [ 'name', 'count' ];

        var output_info = {
            name: {
                header: 'Header Name',
                formatter: noop
            },
            count: {
                header: 'Header Count',
                formatter: numform
            }
        };

        var expectedResults = [
            [ chalk.bold('Header Name'), chalk.bold('Header Count') ],
            [ 'a', '#1' ],
            [ 'b', '#2' ]
        ];

        expect(utils.generateTableData(rows, columns, output_info)).toEqual(expectedResults);
    });

    test('Custom formatter', function () {
        var noop = jest.fn().mockImplementation(function (data) {
            return data;
        });

        var numform = jest.fn().mockImplementation(function (data) {
            return '#' + data;
        });

        var customFormatter = jest.fn().mockImplementation(function (column, data) {
            if (column !== 'name') {
                throw new Error('Unknown field');
            }

            return 'woooo ' + data;
        });

        global.helper = { formatter: customFormatter };

        var rows = [
            {
                name: 'a',
                count: 1
            },
            {
                name: 'b',
                count: 2
            }
        ];

        var columns = [ 'name', 'count' ];

        var output_info = {
            name: {
                header: 'Header Name',
                formatter: noop
            },
            count: {
                header: 'Header Count',
                formatter: numform
            }
        };

        var expectedResults = [
            [ chalk.bold('Header Name'), chalk.bold('Header Count') ],
            [ 'woooo a', '#1' ],
            [ 'woooo b', '#2' ]
        ];

        expect(utils.generateTableData(rows, columns, output_info)).toEqual(expectedResults);
    });
});

describe('Print formatted data', function () {
    test('json', function () {
        jest.spyOn(console, 'info').mockImplementationOnce(function () {});

        global.config = { format: 'json' };

        var data = {
            foo: 'bar',
            bar: 'baz'
        };

        utils.printFormattedData(data, undefined, undefined);
        expect(console.info).toHaveBeenCalledWith(JSON.stringify(data)); // eslint-disable-line no-console
    });

    test('no data', function () {
        jest.spyOn(console, 'info').mockImplementationOnce(function () {});

        global.config = { format: 'table' };

        var data = [];

        utils.printFormattedData(data, undefined, undefined);
        expect(console.info).toHaveBeenCalledWith('No data to display'); // eslint-disable-line no-console
    });

    test('table', function () {
        global.config = { format: 'table' };
        global.helper = undefined;
        jest.spyOn(console, 'info').mockImplementationOnce(function () {});

        var noop = jest.fn().mockImplementation(function (data) {
            return data;
        });
        var numform = jest.fn().mockImplementation(function (data) {
            return '#' + data;
        });

        var rows = [
            {
                name: 'a',
                count: 1
            },
            {
                name: 'b',
                count: 2
            }
        ];

        var columns = [ 'name', 'count' ];

        var output_info = {
            name: {
                header: 'Header Name',
                formatter: noop
            },
            count: {
                header: 'Header Count',
                formatter: numform
            }
        };

        var expectedResults = [
            [ chalk.bold('Header Name'), chalk.bold('Header Count') ],
            [ 'a', '#1' ],
            [ 'b', '#2' ]
        ];

        utils.printFormattedData(rows, columns, output_info);
        expect(console.info).toHaveBeenLastCalledWith(table(expectedResults)); // eslint-disable-line no-console
    });
});

test('Split by field', function () {
    var data = [
        {
            field: 'a',
            value: 1
        },
        {
            field: 'b',
            value: 2
        },
        {
            field: 'a',
            value: 3
        },
        {
            field: undefined,
            value: 4
        }
    ];

    var expectedData = {
        a: [
            {
                field: 'a',
                value: 1
            },
            {
                field: 'a',
                value: 3
            }
        ],
        b: [
            {
                field: 'b',
                value: 2
            }
        ]
    };

    expect(utils.splitByField(data, 'field')).toEqual(expectedData);
});

test('json to console', function () {
    jest.spyOn(console, 'info').mockImplementationOnce(function () {});

    var data = {
        foo: 'bar',
        bar: 'baz'
    };

    utils.outputJSONToConsole(data);
    expect(console.info).toHaveBeenCalledWith(JSON.stringify(data)); // eslint-disable-line no-console
});