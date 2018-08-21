var report = require('../../src/lib/report.js');
global.logger = require('../../src/lib/logger.js');

beforeEach(function () {
    jest.restoreAllMocks();
    global.config = {};
});

test('Initialize averages', function () {
    var expectedResults = {
        field1: 0,
        field2: 0
    };

    var dataMap = {
        field1: {},
        field2: {}
    };

    expect(report.initializeAverages({}, dataMap)).toEqual(expectedResults);
});

describe('Limiting', function () {
    test('No limit', function () {
        var expectedResults = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
        var dataMap = { averages: [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ] };

        expect.assertions(1);
        return report.limitAverages(dataMap).then(function () {
            expect(dataMap.averages).toEqual(expectedResults);
        });
    });

    test('Has limit', function () {
        var expectedResults = [ 1, 2, 3, 4 ];
        var dataMap = { averages: [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ] };

        global.config.limit = 4;

        expect.assertions(1);
        return report.limitAverages(dataMap).then(function () {
            expect(dataMap.averages).toEqual(expectedResults);
        });
    });
});

describe('Sorting', function () {
    test('Unknown key', function () {
        var expectedResults = { averages: [
            {
                field1: 3,
                field2: 'baz'
            },
            {
                field1: 1,
                field2: 'foo'
            },
            {
                field1: 2,
                field2: 'bar'
            }
        ] };

        var dataMap = { averages: [
            {
                field1: 2,
                field2: 'bar'
            },
            {
                field1: 1,
                field2: 'foo'
            },
            {
                field1: 3,
                field2: 'baz'
            }
        ] };

        expect.assertions(1);
        return report.sortAverages(dataMap).then(function () {
            expect(dataMap).toEqual(expectedResults);
        });
    });

    test('Known key', function () {
        var expectedResults = { averages: [
            {
                field1: 3,
                field2: 'baz'
            },
            {
                field1: 2,
                field2: 'bar'
            },
            {
                field1: 1,
                field2: 'foo'
            }
        ] };

        var dataMap = { averages: [
            {
                field1: 2,
                field2: 'bar'
            },
            {
                field1: 1,
                field2: 'foo'
            },
            {
                field1: 3,
                field2: 'baz'
            }
        ] };

        global.config.sort = 'field1';

        expect.assertions(1);
        return report.sortAverages(dataMap).then(function () {
            expect(dataMap).toEqual(expectedResults);
        });
    });
});

test('Generate Group Averages', function () {
    var dataMap = {
        'cpu': 'CPU',
        'run': 'RUN_TIME'
    };
    var additionalData = { testField: 'foo' };
    var logs = [
        {
            CPU: 5,
            RUN_TIME: 1
        },
        {
            CPU: 10,
            RUN_TIME: 1
        },
        {
            CPU: 5,
            RUN_TIME: 1
        },
        {
            CPU: 2,
            RUN_TIME: 1
        }
    ];

    var expectedResults = {
        name: 'testname',
        count: 4,
        testField: 'foo',
        cpu: 5.5,
        run: 1
    };

    expect.assertions(1);
    return report.generateGroupAverage(logs, 'testname', dataMap, additionalData).then(function (averages) {
        expect(averages).toEqual(expectedResults);
    });
});