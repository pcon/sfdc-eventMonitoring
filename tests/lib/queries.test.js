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

describe('Get all logs', function () {
    test('Defined types', function () {
        global.config = { interval: 'hourly' };
        expect(queries.general.getAllLogs([ 'Login', 'Logout' ])).toEqual('select Id, EventType, LogFile, LogDate, LogFileLength from EventLogFile where LogDate = TODAY and Interval = \'Hourly\' and EventType in (\'Login\',\'Logout\') order by LogDate desc');
    });

    test('Undefined types', function () {
        global.config = { interval: 'hourly' };
        expect(queries.general.getAllLogs()).toEqual('select Id, EventType, LogFile, LogDate, LogFileLength from EventLogFile where LogDate = TODAY and Interval = \'Hourly\' order by LogDate desc');
    });
});

test('Get show usage', function () {
    global.config = { interval: 'hourly' };
    expect(queries.show.apiusage()).toEqual('select Id, EventType, LogFile, LogDate, LogFileLength from EventLogFile where LogDate = TODAY and Interval = \'Hourly\' and EventType in (\'ApexSoap\',\'API\',\'RestAPI\')');
});

test('Login', function () {
    global.config = { interval: 'hourly' };
    expect(queries.login()).toEqual('select Id, EventType, LogFile, LogDate, LogFileLength from EventLogFile where LogDate = TODAY and Interval = \'Hourly\' and EventType = \'Login\' order by LogDate desc');
});

test('ApexCallout', function () {
    global.config = { interval: 'hourly' };
    expect(queries.report.apexcallout()).toEqual('select Id, EventType, LogFile, LogDate, LogFileLength from EventLogFile where LogDate = TODAY and Interval = \'Hourly\' and EventType = \'ApexCallout\' order by LogDate desc');
});

test('ApexExecution', function () {
    global.config = { interval: 'hourly' };
    expect(queries.report.apexexecution()).toEqual('select Id, EventType, LogFile, LogDate, LogFileLength from EventLogFile where LogDate = TODAY and Interval = \'Hourly\' and EventType = \'ApexExecution\' order by LogDate desc');
});

test('ApexSoap', function () {
    global.config = { interval: 'hourly' };
    expect(queries.report.apexsoap()).toEqual('select Id, EventType, LogFile, LogDate, LogFileLength from EventLogFile where LogDate = TODAY and Interval = \'Hourly\' and EventType = \'ApexSoap\' order by LogDate desc');
});

test('ApexTrigger', function () {
    global.config = { interval: 'hourly' };
    expect(queries.report.apextrigger()).toEqual('select Id, EventType, LogFile, LogDate, LogFileLength from EventLogFile where LogDate = TODAY and Interval = \'Hourly\' and EventType = \'ApexTrigger\' order by LogDate desc');
});

test('Report', function () {
    global.config = { interval: 'hourly' };
    expect(queries.report.report()).toEqual('select Id, EventType, LogFile, LogDate, LogFileLength from EventLogFile where LogDate = TODAY and Interval = \'Hourly\' and EventType = \'Report\' order by LogDate desc');
});

test('VisualforceRequest', function () {
    global.config = { interval: 'hourly' };
    expect(queries.report.visualforce()).toEqual('select Id, EventType, LogFile, LogDate, LogFileLength from EventLogFile where LogDate = TODAY and Interval = \'Hourly\' and EventType = \'VisualforceRequest\' order by LogDate desc');
});

test('In id criteria', function () {
    expect(queries.functions.inIdCriteria([ 'abc', 'def' ])).toEqual('Id in (\'abc\',\'def\')');
});

test('General users', function () {
    expect(queries.general.users([ 'abc', 'def' ])).toEqual('select Id, Name, Username from User where Id in (\'abc\',\'def\')');
});

test('General reports', function () {
    expect(queries.general.reports([ 'abc', 'def' ])).toEqual('select Id, Name from Report where Id in (\'abc\',\'def\')');
});