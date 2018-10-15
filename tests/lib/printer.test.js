var printer = require('../../src/lib/printer.js');

test('Print', function () {
    global.config = { debug: true };

    var message = 'testmessage';

    jest.spyOn(console, 'info').mockImplementationOnce(function () {});

    printer.print(message);
    expect(console.info).toHaveBeenCalledWith(message); // eslint-disable-line no-console
});