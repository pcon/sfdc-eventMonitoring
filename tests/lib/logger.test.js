var logger = require('../../src/lib/logger.js');

describe('debug', function () {
    test('With debug flag', function () {
        global.config = { debug: true };

        var message = 'testmessage';

        jest.spyOn(console, 'debug').mockImplementationOnce(function () {});

        logger.debug(message);
        expect(console.debug).toHaveBeenCalledWith(message); // eslint-disable-line no-console
    });

    test('Without debug flag', function () {
        var message = 'testmessage2';

        global.config = {};

        jest.spyOn(console, 'log').mockImplementationOnce(function () {});

        logger.debug(message);
        expect(console.log).not.toHaveBeenCalledWith(message); // eslint-disable-line no-console
    });
});

describe('log', function () {
    test('With debug flag', function () {
        global.config = { debug: true };

        var message = 'testmessage';

        jest.spyOn(console, 'info').mockImplementationOnce(function () {});

        logger.log(message);
        expect(console.info).toHaveBeenCalledWith(message); // eslint-disable-line no-console
    });
});

describe('error', function () {
    test('With debug flag', function () {
        global.config = { debug: true };

        var message = 'testmessage';

        jest.spyOn(console, 'error').mockImplementationOnce(function () {});

        logger.error(message);
        expect(console.error).toHaveBeenCalledWith(message); // eslint-disable-line no-console
    });
});