var formatter = require('../../src/lib/formatter.js');

test('Converting nano seconds to pretty', function () {
    expect(formatter.nanoToMsToPretty(10000000)).toEqual('10ms');
});

test('Do nothing', function () {
    expect(formatter.noop('NOOP')).toEqual('NOOP');
});

test('Percentage', function () {
    expect(formatter.percent('50')).toEqual('50%');
});