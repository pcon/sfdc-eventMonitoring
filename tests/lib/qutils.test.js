var qutils = require('../../src/lib/qutils.js');

test('Split result values', function () {
    var results = [
        {
            state: 'fulfilled',
            value: 'a'
        },
        {
            state: 'unfulfilled',
            reason: 'b'
        }
    ];
    var expectedResults = {
        values: [ 'a' ],
        errors: [ 'b' ]
    };
    expect(qutils.functions.splitResultValues(results)).toEqual(expectedResults);
});

test('Get result values', function () {
    var results = [
        {
            state: 'fulfilled',
            value: 'a'
        },
        {
            state: 'unfulfilled',
            reason: 'b'
        }
    ];
    var expectedResults = [ 'a' ];
    expect(qutils.getResultValues(results)).toEqual(expectedResults);
});

test('Get result errors', function () {
    var results = [
        {
            state: 'fulfilled',
            value: 'a'
        },
        {
            state: 'unfulfilled',
            reason: 'b'
        }
    ];
    var expectedResults = [ 'b' ];
    expect(qutils.functions.getResultErrors(results)).toEqual(expectedResults);
});