/**
 * Generates a config file entry
 * @param {string} describe The field description
 * @param {string} type The field type
 * @param {string} alias The field alias
 * @param {object} default_value The default value
 * @returns {object} A configuration entry
 */
function generateConfig(describe, type, alias, default_value) {
    var config = {
        describe: describe,
        type: type,
        default: default_value
    };

    if (alias !== undefined) {
        config.alias = alias;
    }

    return config;
}

/**
* Sets the choices available
* @param {object} config The configuration to append
* @param {object} choices The choices available
* @returns {object} A configuration entry
*/
function setChoices(config, choices) {
    config.choices = choices;
    return config;
}

module.exports = {
    asc: generateConfig('Sort the data in ascending order', 'boolean', false),
    cache: generateConfig('The directory to cache the event logs', 'string'),
    date: generateConfig('The day to get (in GMT)', 'string'),
    debug: generateConfig('Enable debug logging', 'boolean', 'd'),
    end: generateConfig('The end date/time to get (in GMT)', 'string'),
    env: generateConfig('The envirionment name', 'string', 'e'),
    file: generateConfig('The file to save to.  If unset, output will be sent to stdout', 'string'),
    format: setChoices(generateConfig('The format to output', 'string', undefined, 'table'), [ 'json', 'table' ]),
    helper: generateConfig('The local helper to use', 'string'),
    interval: setChoices(generateConfig('The interval to use', 'string', undefined, 'hourly'), [ 'hourly', 'daily' ]),
    latest: generateConfig('Use the most recent data', 'boolean', undefined, true),
    limit: generateConfig('The number of results to limit to', 'number'),
    maxversion: generateConfig('The max version to display', 'number'),
    password: generateConfig('The Salesforce password', 'string', 'p'),
    sandbox: generateConfig('The Salesforce instance is a sandbox', 'boolean'),
    solenopsis: generateConfig('User solenopsis configs for environments', 'boolean'),
    sort: generateConfig('The field to sort by.  Use a comma seperated list to sort by multiple fields', 'string', undefined, 'count'),
    split: generateConfig('The output should be split into multiple files', 'boolean', undefined, false),
    start: generateConfig('The start date/time to get (in GMT)', 'string'),
    sublimit: generateConfig('The number of results to sub-limit to', 'number'),
    subsort: generateConfig('The sub-field to sort by.  Use a comma seperated list to sort by multiple fields', 'string', undefined, 'count'),
    summary: generateConfig('Summarize the data', 'boolean'),
    token: generateConfig('The Salesforce token', 'string', 't'),
    userid: generateConfig('A user id to filter the results by', 'string'),
    username: generateConfig('The Salesforce username', 'string', 'u')
};