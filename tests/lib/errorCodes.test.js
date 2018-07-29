var errorCodes = require('../../src/lib/errorCodes.js');

test('Testing codes', function () {
    var expectedResults = {
        UNSUPPORTED_HANDLER: -2,
        NO_ENVIRONMENTS: -3,
        INCOMPLETE_CREDS: -4,
        NO_LOGFILES: -5,
        NO_CONNECTION_QUERY: -100,
        NO_CONNECTION_FETCH: -101
    };
    expect(errorCodes).toEqual(expect.objectContaining(expectedResults));
});