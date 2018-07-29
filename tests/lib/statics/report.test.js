var report = require('../../../src/lib/statics/report.js');

var formatter = require('../../../src/lib/formatter.js');

test('Generate report entry', function () {
    var expectedResults = {
        header: 'HEADER',
        formatter: 'FORMATTER'
    };
    expect(report.generateEntry('HEADER', 'FORMATTER')).toEqual(expectedResults);
});

test('Generate output info', function () {
    var expectedResults = {
        id: {
            header: 'Id',
            formatter: formatter.noop
        },
        soql: {
            header: 'SOQL Count',
            formatter: formatter.noop
        }
    };

    expect(report.generateOutputInfo([ 'id', 'soql' ])).toEqual(expectedResults);
});