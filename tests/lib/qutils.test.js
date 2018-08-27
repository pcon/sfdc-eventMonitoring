var Q = require('q');
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

test('All settled push array', function () {
    var deferred = Q.defer();
    var deferred1 = Q.defer();
    var deferred2 = Q.defer();
    var promises = [ deferred1.promise, deferred2.promise ];

    deferred1.resolve('a');
    deferred2.reject('b');

    expect.assertions(1);
    qutils.allSettledPushArray(deferred, promises);
    return deferred.promise.then(function (data) {
        expect(data).toEqual([ 'a' ]);
    });
});

test('All Settled Push Value', function () {
    var deferred = Q.defer();
    var deferred1 = Q.defer();
    var deferred2 = Q.defer();
    var promises = [ deferred1.promise, deferred2.promise ];
    var grouping = { g: 'g' };
    var expectedResults = {
        grouping: { g: 'g' },
        test: [ 'a' ]
    };

    deferred1.resolve('a');
    deferred2.reject('b');

    expect.assertions(1);
    qutils.allSettledPushValue(deferred, promises, grouping, 'test');
    return deferred.promise.then(function (data) {
        expect(data).toEqual(expectedResults);
    });
});

test('All Settled Reject Errors', function () {
    var deferred = Q.defer();
    var deferred1 = Q.defer();
    var deferred2 = Q.defer();
    var promises = [ deferred1.promise, deferred2.promise ];

    deferred1.resolve('a');
    deferred2.reject('b');

    expect.assertions(1);
    qutils.allSettledRejectErrors(deferred, promises);
    return deferred.promise.catch(function (error) {
        expect(error).toEqual([ 'b' ]);
    });
});

describe('Reject Resolve', function () {
    test('Reject', function () {
        var deferred = Q.defer();
        deferred.reject('a');

        expect.assertions(1);
        return deferred.promise.catch(function (error) {
            expect(error).toEqual('a');
        });
    });

    test('Resolve', function () {
        var deferred = Q.defer();
        deferred.resolve('a');

        expect.assertions(1);
        return deferred.promise.then(function (data) {
            expect(data).toEqual('a');
        });
    });
});