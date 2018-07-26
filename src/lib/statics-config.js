/**
 * Generates a config file entry
 * @param {string} describe The field description
 * @param {string} type The field type
 * @param {string} alias The field alias
 * @param {object} default_value The default value
 * @param {object} choices The choices available
 * @returns {object} A configuration entry
 */
function generateConfig(describe, type, alias, default_value, choices) {
    return {
        describe: describe,
        type: type,
        alias: alias,
        default: default_value,
        choices: choices
    };
}

module.exports = {
    asc: generateConfig('Sort the data in ascending order', 'boolean', false),
    sort: generateConfig('The field to sort by.  Use a comma seperated list to sort by multiple fields', 'string', undefined, 'count'),
    limit: generateConfig('The number of results to limit to', 'number'),
    maxversion: generateConfig('The max version to display', 'number'),
    summary: generateConfig('Summarize the data', 'boolean'),
    env: generateConfig('The envirionment name', 'string', 'e'),
    username: generateConfig('The Salesforce username', 'string', 'u'),
    password: generateConfig('The Salesforce password', 'string', 'p'),
    token: generateConfig('The Salesforce token', 'string', 't'),
    sandbox: generateConfig('The Salesforce instance is a sandbox', 'boolean'),
    solenopsis: generateConfig('User solenopsis configs for environments', 'boolean'),
    cache: generateConfig('The directory to cache the event logs', 'string'),
    interval: generateConfig('The interval to use', 'string', undefined, 'hourly', [ 'hourly', 'daily' ]),
    latest: generateConfig('Use the most recent data', 'boolean', undefined, true),
    start: generateConfig('The start date/time to get (in GMT)', 'string'),
    end: generateConfig('The end date/time to get (in GMT)', 'string'),
    date: generateConfig('The day to get (in GMT)', 'string'),
    helper: generateConfig('The local helper to use', 'string'),
    debug: generateConfig('Enable debug logging', 'boolean', 'd')
};