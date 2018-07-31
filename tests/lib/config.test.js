var moment = require('moment');

var config = require('../../src/lib/config.js');
var errorCodes = require('../../src/lib/errorCodes.js');
global.logger = require('../../src/lib/logger.js');

beforeEach(function () {
    jest.restoreAllMocks();

    expect.extend({
        toBeSameDay: function (received, argument) { // eslint-disable-line require-jsdoc
            if (argument.isSame(received, 'day')) {
                return {
                    message: function () { // eslint-disable-line require-jsdoc
                        return 'expected to be the same day';
                    },
                    pass: true
                };
            } else {
                return {
                    message: function () { // eslint-disable-line require-jsdoc
                        return 'expected ' + received.format() + ' to be the same day as ' + argument.format();
                    },
                    pass: false
                };
            }
        },
        toBeSame: function (received, argument) { // eslint-disable-line require-jsdoc
            if (argument.format() === received.format()) {
                return {
                    message: function () { // eslint-disable-line require-jsdoc
                        return 'expected to be the same';
                    },
                    pass: true
                };
            } else {
                return {
                    message: function () { // eslint-disable-line require-jsdoc
                        return 'expected ' + received.format() + ' to be the same as ' + argument.format();
                    },
                    pass: false
                };
            }
        }

    });
});

test('Merge', function () {
    global.config = { foo: 'bar' };

    var expectedResults = {
        foo: 'bar',
        bar: 'baz'
    };

    config.merge({ bar: 'baz' });
    expect(global.config).toEqual(expectedResults);
});

describe('Setup Globals', function () {
    test('Undefined helper', function () {
        global.config = {};

        config.setupGlobals()
            .then(function () {
                expect(global.helper).toBeUndefined();
            });
    });

    test('Local helper', function () {
        global.config = { helper: '../helper.js' };

        config.setupGlobals()
            .then(function () {
                expect(global.helper).anything();
                expect(global.helper()).toEqual('abcdef');
            });
    });
});

describe('Is Undefined', function () {
    test('Config has all in array', function () {
        global.config = {
            foo: 'bar',
            bar: 'baz'
        };

        expect(config.isUndefined([ 'foo', 'bar' ])).toBeFalsy();
    });

    test('Config missing one in array', function () {
        global.config = { bar: 'baz' };

        expect(config.isUndefined([ 'foo', 'bar' ])).toBeTruthy();
    });

    test('Config missing', function () {
        global.config = { bar: 'baz' };

        expect(config.isUndefined('foo')).toBeTruthy();
    });

    test('Config exists', function () {
        global.config = {
            foo: 'bar',
            bar: 'baz'
        };

        expect(config.isUndefined('foo')).toBeFalsy();
    });
});

describe('Handlers', function () {
    test('Unknown, default type', function () {
        global.config = { type: 'testhandler' };
        var handlers = {};
        jest.spyOn(process, 'exit').mockImplementationOnce(function () {});
        jest.spyOn(console, 'error').mockImplementationOnce(function () {});

        config.checkHandlers(handlers);
        expect(process.exit).toHaveBeenCalledWith(errorCodes.UNSUPPORTED_HANDLER);
        expect(console.error).toHaveBeenCalledWith('testhandler does not have a supported handler'); // eslint-disable-line no-console
    });

    test('Unknown, custom type', function () {
        global.config = { action: 'testhandler' };
        var handlers = {};
        jest.spyOn(process, 'exit').mockImplementationOnce(function () {});
        jest.spyOn(console, 'error').mockImplementationOnce(function () {});

        config.checkHandlers(handlers, 'action');
        expect(process.exit).toHaveBeenCalledWith(errorCodes.UNSUPPORTED_HANDLER);
        expect(console.error).toHaveBeenCalledWith('testhandler does not have a supported handler'); // eslint-disable-line no-console
    });

    test('Undefined, default type', function () {
        global.config = { type: 'testhandler' };
        var handlers = { testhandler: undefined };
        jest.spyOn(process, 'exit').mockImplementationOnce(function () {});
        jest.spyOn(console, 'error').mockImplementationOnce(function () {});

        config.checkHandlers(handlers);
        expect(process.exit).toHaveBeenCalledWith(errorCodes.UNSUPPORTED_HANDLER);
        expect(console.error).toHaveBeenCalledWith('testhandler does not have a supported handler'); // eslint-disable-line no-console
    });

    test('Defined, default type', function () {
        global.config = { type: 'testhandler' };
        var handlers = { testhandler: jest.fn() };
        jest.spyOn(process, 'exit').mockImplementationOnce(function () {});
        jest.spyOn(console, 'error').mockImplementationOnce(function () {});

        config.checkHandlers(handlers);
        expect(process.exit).not.toHaveBeenCalledWith(errorCodes.UNSUPPORTED_HANDLER);
        expect(console.error).not.toHaveBeenCalledWith('testhandler does not have a supported handler'); // eslint-disable-line no-console
    });
});

describe('Get end', function () {
    test('Undefined end', function () {
        var now = moment.utc();

        global.config = {};

        expect(config.date.getEnd()).toBeSameDay(now);
    });

    test('Defined end datetime', function () {
        var m = moment.utc('2018-07-29T11:38:00.000Z');

        global.config = { end: '2018-07-29T11:38:00.000Z' };

        expect(config.date.getEnd()).toBeSame(m);
    });

    test('Defined end date', function () {
        var m = moment.utc('2018-07-29T23:59:59.000Z');

        global.config = { date: '2018-07-29' };

        expect(config.date.getEnd()).toBeSame(m);
    });
});

describe('Get start', function () {
    test('Undefined start', function () {
        var now = moment.utc(0);

        global.config = {};

        expect(config.date.getStart()).toBeSameDay(now);
    });

    test('Defined start datetime', function () {
        var m = moment.utc('2018-07-29T11:38:00.000Z');

        global.config = { start: '2018-07-29T11:38:00.000Z' };

        expect(config.date.getStart()).toBeSame(m);
    });

    test('Defined start date', function () {
        var m = moment.utc('2018-07-29T00:00:00.000Z');

        global.config = { date: '2018-07-29' };

        expect(config.date.getStart()).toBeSame(m);
    });
});

describe('Has a date', function () {
    test('Has no dates', function () {
        global.config = {};

        expect(config.date.hasADate()).toBeFalsy();
    });

    test('Has a start date', function () {
        global.config = { start: 'foo' };

        expect(config.date.hasADate()).toBeTruthy();
    });

    test('Has a end date', function () {
        global.config = { end: 'foo' };

        expect(config.date.hasADate()).toBeTruthy();
    });

    test('Has a date', function () {
        global.config = { date: 'foo' };

        expect(config.date.hasADate()).toBeTruthy();
    });
});

describe('Yargs config', function () {
    test('Options with no positional', function () {
        var yargs = {
            positional: jest.fn(),
            options: jest.fn()
        };

        var options = { foo: 'bar' };

        config.yargs.config(yargs, undefined, options);
        expect(yargs.positional).not.toHaveBeenCalled();
        expect(yargs.options).toBeCalledWith(options);
    });

    test('Single positional', function () {
        var yargs = {
            positional: jest.fn(),
            options: jest.fn()
        };

        var positional = {
            name: 'pos',
            options: { bar: 'baz' }
        };
        var options = { foo: 'bar' };

        config.yargs.config(yargs, positional, options);
        expect(yargs.positional).toBeCalledWith(positional.name, positional.options);
        expect(yargs.options).toBeCalledWith(options);
    });

    test('Multiple positional', function () {
        var yargs = {
            positional: jest.fn(),
            options: jest.fn()
        };

        var positional_one = {
            name: 'pos1',
            options: { bar: 'baz' }
        };
        var positional_two = {
            name: 'pos2',
            options: { tit: 'tat' }
        };
        var options = { foo: 'bar' };

        config.yargs.config(yargs, [ positional_one, positional_two ], options);
        expect(yargs.positional).toHaveBeenNthCalledWith(1, positional_one.name, positional_one.options);
        expect(yargs.positional).toHaveBeenNthCalledWith(2, positional_two.name, positional_two.options);
        expect(yargs.options).toBeCalledWith(options);
    });
});

test('Generate pdata', function () {
    var name = 'testname';
    var description = 'testdesc';
    var handlers = {
        foo: 'bar',
        bar: 'baz'
    };

    var expectedResults = {
        name: name,
        options: {
            type: 'string',
            description: description,
            choices: [ 'foo', 'bar' ]
        }
    };

    expect(config.yargs.generatePdata(name, description, handlers)).toEqual(expectedResults);
});

test('Generate type pdata', function () {
    var description = 'testdesc';
    var handlers = {
        foo: 'bar',
        bar: 'baz'
    };

    var expectedResults = {
        name: 'type',
        options: {
            type: 'string',
            description: description,
            choices: [ 'foo', 'bar' ]
        }
    };

    expect(config.yargs.generateTypePdata(description, handlers)).toEqual(expectedResults);
});

test('Generate options', function () {
    var expectedResults = {
        token: {
            alias: 't',
            describe: 'The Salesforce token',
            type: 'string',
            default: undefined
        },
        format: {
            describe: 'The format to output',
            type: 'string',
            default: 'table',
            choices: [ 'json', 'table' ]
        }
    };

    expect(config.yargs.generateOptions([ 'token', 'format' ])).toEqual(expectedResults);
});