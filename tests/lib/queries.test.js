var queries = require('../../src/lib/queries.js');

describe('Format criteria', function () {
    test('Undefined', function () {
        expect(queries.functions.formatCriteria(undefined)).toEqual('');
    });

    test('String', function () {
        expect(queries.functions.formatCriteria('just string')).toEqual('just string');
    });

    test('Array', function () {
        expect(queries.functions.formatCriteria([ 'string1', 'string2' ])).toEqual('string1 and string2');
    });

    test('Complex or', function () {
        var criteria = {
            clauses: [
                '(test1 and test2)',
                '(test3 or test4)'
            ],
            operator: 'or'
        };

        expect(queries.functions.formatCriteria(criteria)).toEqual('(test1 and test2) or (test3 or test4)');
    });
});

describe('Build simple query', function () {
    test('Simple', function () {
        var fields = [ 'field1', 'field2' ];
        var object_name = 'object';
        var criteria = 'field1 = \'dengar\'';

        expect(queries.functions.buildSimpleQuery(fields, object_name, criteria)).toEqual('select field1, field2 from object where field1 = \'dengar\'');
    });

    test('Order', function () {
        var fields = [ 'field1', 'field2' ];
        var object_name = 'object';
        var criteria = 'field1 = \'dengar\'';
        var order = 'field2';

        expect(queries.functions.buildSimpleQuery(fields, object_name, criteria, order)).toEqual('select field1, field2 from object where field1 = \'dengar\' order by field2');
    });

    test('Limit', function () {
        var fields = [ 'field1', 'field2' ];
        var object_name = 'object';
        var criteria = 'field1 = \'dengar\'';
        var limit = 5;

        expect(queries.functions.buildSimpleQuery(fields, object_name, criteria, undefined, limit)).toEqual('select field1, field2 from object where field1 = \'dengar\' limit 5');
    });

    test('Order and limit', function () {
        var fields = [ 'field1', 'field2' ];
        var object_name = 'object';
        var criteria = 'field1 = \'dengar\'';
        var order = 'field2';
        var limit = 5;

        expect(queries.functions.buildSimpleQuery(fields, object_name, criteria, order, limit)).toEqual('select field1, field2 from object where field1 = \'dengar\' order by field2 limit 5');
    });
});

describe('Get log date', function () {
    test('Has a date', function () {
        global.config = {
            start: '2014-02-25T01:30:00.000Z',
            end: '2018-07-29T07:38:00.000Z'
        };
        expect(queries.functions.getLogDate()).toEqual('LogDate >= 2014-02-25T01:30:00.000Z and LogDate <= 2018-07-29T07:38:00.000Z');
    });

    test('Hourly', function () {
        global.config = { interval: 'hourly' };
        expect(queries.functions.getLogDate()).toEqual('LogDate = TODAY');
    });

    test('Daily', function () {
        global.config = { interval: 'daily' };
        expect(queries.functions.getLogDate()).toEqual('LogDate = LAST_N_DAYS:2');
    });
});

test('Get interval', function () {
    global.config = { interval: 'hourly' };
    expect(queries.functions.getInterval()).toEqual('Interval = \'Hourly\'');
});

describe('Get event type criteria', function () {
    test('Single', function () {
        expect(queries.functions.getEventTypeCriteria('Login')).toEqual('EventType = \'Login\'');
    });

    test('Multiple', function () {
        expect(queries.functions.getEventTypeCriteria([ 'Login', 'Logout' ])).toEqual('EventType in (\'Login\',\'Logout\')');
    });
});

test('Get all logs', function () {
    global.config = { interval: 'hourly' };
    expect(queries.general.getAllLogs([ 'Login', 'Logout' ])).toEqual('select Id, EventType, LogFile, LogDate, LogFileLength from EventLogFile where LogDate = TODAY and Interval = \'Hourly\' and EventType in (\'Login\',\'Logout\') order by LogDate desc');
});