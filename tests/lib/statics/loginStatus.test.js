var loginStatus = require('../../../src/lib/statics/loginStatus.js');

test('Get unknown message', function () {
    expect(loginStatus.getMessage('UNKNOWNKEY')).toEqual('UNKNOWNKEY');
});

test('Get known message', function () {
    expect(loginStatus.getMessage('LOGIN_ERROR_ORG_LOCKOUT')).toEqual('Organization locked');
});