var report = require('../../src/lib/report.js');

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