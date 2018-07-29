var conf = require('../../../src/lib/statics/config.js');

test('Generate a config entry without an alias', function () {
    var expectedResults = {
        describe: 'Test Description',
        type: 'Test Type',
        alias: undefined,
        default: 'Test Default'
    };

    expect(conf.functions.generateConfig('Test Description', 'Test Type', undefined, 'Test Default')).toEqual(expectedResults);
});

test('Generate a config entry with an alias', function () {
    var expectedResults = {
        describe: 'Test Description',
        type: 'Test Type',
        alias: 'Test Alias',
        default: 'Test Default'
    };

    expect(conf.functions.generateConfig('Test Description', 'Test Type', 'Test Alias', 'Test Default')).toEqual(expectedResults);
});

test('Set configuration choices', function () {
    var expectedResults = {
        describe: 'Test Description',
        type: 'Test Type',
        alias: undefined,
        default: 'Test Default',
        choices: [ 'Choice1', 'Choice2' ]
    };

    expect(conf.functions.setChoices(conf.functions.generateConfig('Test Description', 'Test Type', undefined, 'Test Default'), [ 'Choice1', 'Choice2' ])).toEqual(expectedResults);
});