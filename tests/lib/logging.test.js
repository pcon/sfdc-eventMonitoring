var logging = require('../../src/lib/logging.js');
global.logger = require('../../src/lib/logger.js');

test('Log and exit ', function () {
    var message = 'testmessage';
    var errorCode = -300;

    jest.spyOn(process, 'exit').mockImplementationOnce(function () {});
    jest.spyOn(console, 'error').mockImplementationOnce(function () {});

    logging.logAndExit(message, errorCode);
    expect(process.exit).toHaveBeenCalledWith(errorCode);
    expect(console.error).toHaveBeenCalledWith(message); // eslint-disable-line no-console
});

test('Log', function () {
    var message = 'testmessage';

    jest.spyOn(console, 'error').mockImplementationOnce(function () {});

    logging.logError(message);
    expect(console.error).toHaveBeenCalledWith(message); // eslint-disable-line no-console
});
