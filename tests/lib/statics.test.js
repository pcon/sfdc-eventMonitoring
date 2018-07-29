var statics = require('../../src/lib/statics.js');

test('Checking statics', function () {
    var expectedResults = {
        CONNECTION: {
            SANDBOX_URL: 'https://test.salesforce.com',
            PROD_URL: 'https://login.salesforce.com',
            VERSION: '43.0'
        },
        DATETIME_FORMAT: 'YYYY-MM-DDTHH:mm:ss.000\\Z',
        DATE_FORMAT: 'YYYY-MM-DD'
    };
    expect(statics).toEqual(expect.objectContaining(expectedResults));
});