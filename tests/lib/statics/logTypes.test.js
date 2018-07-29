var logTypes = require('../../../src/lib/statics/logTypes.js');

test('Check log types', function () {
    var expectedEntries = [
        'API',
        'ApexCallout',
        'ApexExecution',
        'ApexSoap',
        'ApexTrigger',
        'Login',
        'Report',
        'RestAPI',
        'VisualforceRequest'
    ];
    expect(logTypes.types).toEqual(expect.arrayContaining(expectedEntries));
});