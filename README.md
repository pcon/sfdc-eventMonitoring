# Event Monitoring
[![Build Status](https://travis-ci.org/pcon/sfdc-eventMonitoring.svg?branch=master)](https://travis-ci.org/pcon/sfdc-eventMonitoring)
[![Code Climate](https://codeclimate.com/github/pcon/sfdc-eventMonitoring/badges/gpa.svg)](https://codeclimate.com/github/pcon/sfdc-eventMonitoring)
[![Coverage Status](https://coveralls.io/repos/github/pcon/sfdc-eventMonitoring/badge.svg?branch=master)](https://coveralls.io/github/pcon/sfdc-eventMonitoring?branch=master)

This application is a command-line interface for interacting with the Event Monitoring capabilities of Salesforce.

This application is in a very early state and is limited in it's functionality.  Additionally, it may eat your babies if you leave it alone in the same room with them.  You have been warned.

# Installation
The application is installed via `npm`

```bash
npm -g install sfdc-eventmonitoring
```

# Usage
Basic usage is to run the `eventmonitoring` command with a `--help` to see all of the available commands.  You will need to make sure you provide your authentication information to login to your org.

## Authentication
This can be provided in a couple of ways

### Command-line
The simplest way to do it is to provide username, password and token as command-line parameters

```bash
eventmonitoring --username user@example.com --password donthackme --token 123abc
```

**Flags**
*   **--interval \[interval\]** - hourly, daily - The interval to use for the data
*   **--latest=\[true,false\]** - If we should get the latest (single) log
*   **--date \[date\]** - The date
*   **--start \[datetime\]** - The start date/time
*   **--end \[datetime\]** - The end date/time

### Solenopsis
The application support usage of [Solenopsis](http://solenopsis.org/Solenopsis/) style configuration files and locations.

For example you can create the following `prod.properties` credentials files in `$HOME/.solenopsis/credentials/prod.properties`

```text
username=user@example.com
password=donthackme
token=123abc
url=https://login.salesforce.com
```

Then run the application using the `env` and `solenopsis` flags

```bash
eventmonitoring --env prod --solenopsis
```

### Configuration File
You can also store these values in the `$HOME/.eventmonitoring` config file

```json
{
  "username": "user@example.com",
  "password": "donthackme",
  "token": "123abc"
}
```

```json
{
  "env": "prod",
  "solenopsis": true
}
```

### Caching
You can enable caching by adding the `--cache /path/to/cache/folder` or adding the following to your config file

```json
"cache": "/path/to/cache/folder"
```

## Cache
This sub command interacts with the cache.  If you do not have a cache set up in the config or command line flag, this will not work.

### Stats
Shows cache stats

```bash
eventmonitoring cache stats
```

```text
Total Size Usage: 90.5 MB
      JSON Usage: 46.4 MB
       CSV Usage: 44.1 MB


╔════════════╤═════════╗
║ Date       │ Usage   ║
╟────────────┼─────────╢
║ 2018-07-18 │ 90.5 MB ║
╚════════════╧═════════╝
```

### Clear
Clears the cache

#### Clear all the cache
```bash
eventmonitoring cache clear
```

#### Clear a specific date's cache
```bash
eventmonitoring cache clear --date 2018-07-18
```

#### Clear a date range's cache
```bash
eventmonitoring cache clear --start 2018-07-18T00:00:00.000Z --end 2018-07-18T02:00:00.000Z
```

## Dump
This sub command dumps all the data to stdout or disk

**Flags**
*   **--format \[format\]** - json - The format the output should be displayed in
*   **--type \[type\]** - The event type to dump
*   **--split** - Split the files based on event type
*   **--file \[filename\]** - The filename to save the data to

```bash
eventmonitoring dump --type ApexSoap --type Login --type API --file events.json --split
```

```text
# ls
events_ApexSoap.json
events_Login.json
events_API.json
```

## Blame
This sub command "blames" users for doing things

**Flags**
*   **--format \[format\]** - json, table - The format the output should be displayed in
*   **--asc** - Sort the data in ascending order
*   **--sort \[field1,field2\]** - The fields to sort the data by.  This will vary from type to type.
*   **--limit \[limit\]** - The number of results to limit to
*   **--subsort \[field1,field2\]** - The fields to sort the secondary data by.  This will vary from type to type.
*   **--sublimit \[limit\]** - The number of results for secondary data to limit to.
*   **--userid \[id\]** - The user id to return.  This can be stacked to return multiple users

### API Usage
Data around users and API usage

The summary mode can be useful for getting an idea of the overal usage of your API

```bash
eventmonitoring blame apiusage --summary
```

```text
╔══════════════════════╤══════════════════════════════════════════════╤═════════════════╤════════╗
║ Name                 │ Username                                     │ Id              │ Count  ║
╟──────────────────────┼──────────────────────────────────────────────┼─────────────────┼────────╢
║ Integration User     │ integrationuser@example.com                  │ 005A000000abcde │ 238084 ║
╟──────────────────────┼──────────────────────────────────────────────┼─────────────────┼────────╢
║ Utility User         │ utility@api.example.com                      │ 005A000000abcdf │ 11081  ║
╟──────────────────────┼──────────────────────────────────────────────┼─────────────────┼────────╢
║ Script Kiddie        │ scriptkiddie@example.com                     │ 005A000000abcdg │ 7168   ║
╟──────────────────────┼──────────────────────────────────────────────┼─────────────────┼────────╢
║ Another User         │ anotherautomationuser@example.com            │ 005A000000abcdh │ 2037   ║
╚══════════════════════╧══════════════════════════════════════════════╧═════════════════╧════════╝
```

For more information you can get a breakdown per user per endpoint

```bash
eventmonitoring blame apiusage --limit 3 --sublimit 4
```

```text
User: Integration User - integrationuser@example.com - 005A000000abcde
Total API Calls: 43,289
╔══════════════════════════════════╤═══════╗
║ Endpoint                         │ Count ║
╟──────────────────────────────────┼───────╢
║ CaseAPI.listAttachments          │ 10814 ║
╟──────────────────────────────────┼───────╢
║ AccountAPI.getContactsForAccount │ 10152 ║
╟──────────────────────────────────┼───────╢
║ CaseAPI.getCase                  │ 10109 ║
╟──────────────────────────────────┼───────╢
║ AccountAPI.getAccount            │ 10099 ║
╚══════════════════════════════════╧═══════╝

User: Utility User - utility@api.example.com - 005A000000abcdf
Total API Calls: 19,974
╔══════════════════════════════════╤═══════╗
║ Endpoint                         │ Count ║
╟──────────────────────────────────┼───────╢
║ CaseAPI.getCase                  │ 2137  ║
╟──────────────────────────────────┼───────╢
║ CaseAPI.listAttachments          │ 1930  ║
╟──────────────────────────────────┼───────╢
║ ContactAPI.getContact            │ 1840  ║
╟──────────────────────────────────┼───────╢
║ AccountAPI.getContactsForAccount │ 1738  ║
╚══════════════════════════════════╧═══════╝

User: Script Kiddie - scriptkiddie@example.com - 005A000000abcdg
Total API Calls: 2,084
╔═════════════════════════════════╤═══════╗
║ Endpoint                        │ Count ║
╟─────────────────────────────────┼───────╢
║ ProductAPI.listVersions         │ 2046  ║
╟─────────────────────────────────┼───────╢
║ ProductAPI.listEntitledProducts │ 20    ║
╟─────────────────────────────────┼───────╢
║ InternalAPI.upsertCaseComment   │ 10    ║
╟─────────────────────────────────┼───────╢
║ ProductAPI.listProducts         │ 8     ║
╚═════════════════════════════════╧═══════╝
```

## Login
This sub command is used around Login data

**Flags**
*   **--format \[format\]** - json, table - The format the output should be displayed in
*   **--asc** - Sort the data in ascending order
*   **--sort** - The field to sort the data by.  This will vary from report type to report type.
*   **--limit \[limit\]** - The number of results to limit to
*   **--maxversion** - The max API version.  Only used with apiversion
*   **--summary** - Summerize the results.  Only used with apiversion

### APIVersion
Report based on the API Version.

The summary mode is useful to see if you have API clients using older versions of the API

```bash
eventmonitoring login apiversion --summary
```

```text
╔═════════╤═══════╗
║ Version │ Count ║
╟─────────┼───────╢
║ 8       │ 60    ║
╟─────────┼───────╢
║ 19      │ 228   ║
╟─────────┼───────╢
║ 29      │ 61    ║
╟─────────┼───────╢
║ 30      │ 11    ║
╟─────────┼───────╢
║ 32      │ 74    ║
╟─────────┼───────╢
║ 33      │ 1     ║
╟─────────┼───────╢
║ 35      │ 5     ║
╟─────────┼───────╢
║ 37      │ 11    ║
╟─────────┼───────╢
║ 39      │ 35    ║
╟─────────┼───────╢
║ 40      │ 20    ║
╚═════════╧═══════╝
```

Without the summary flag, it will group by username.  Most likely, you'll want to apply the max version flag to limit it to only older versions of the API to "blame" users

```bash
eventmonitoring login apiversion --maxversion 30
```

```text
╔═════════╤══════════════════════════════════════════════╤═══════╗
║ Version │ Username                                     │ Count ║
╟─────────┼──────────────────────────────────────────────┼───────╢
║ 8       │ utility@api.example.com                      │ 60    ║
╟─────────┼──────────────────────────────────────────────┼───────╢
║ 19      │ automationuser@example.com                   │ 228   ║
╟─────────┼──────────────────────────────────────────────┼───────╢
║ 29      │ scriptkiddie@api.example.com                 │ 60    ║
╟─────────┼──────────────────────────────────────────────┼───────╢
║ 29      │ anotherautomationuser@example.com            │ 1     ║
╚═════════╧══════════════════════════════════════════════╧═══════╝
```

### Failed Login
Report based on failed logins

```bash
eventmonitoring login failed
```

```text
╔═════════════════════╤═══════╤══════════════════════════════╗
║ Username            │ Count │ Error Message                ║
╟─────────────────────┼───────┼──────────────────────────────╢
║ user1@example.com   │ 1     │ Failed: InResponseTo Invalid ║
╟─────────────────────┼───────┼──────────────────────────────╢
║ user2@example.com   │ 1     │ Failed: InResponseTo Invalid ║
╚═════════════════════╧═══════╧══════════════════════════════╝
```

## Report
This sub command is used to report on Event Monitoring data

**Flags**
*   **--format \[format\]** - json, table - The format the output should be displayed in
*   **--asc** - Sort the data in ascending order
*   **--sort** - The field to sort the data by.  This will vary from report type to report type.
*   **--limit \[limit\]** - The number of results to limit to

### Apex Callouts
Reporting based on ApexCallout data

```bash
eventmonitoring report apexcallout
```

```text
╔══════════════════════════════════════════════════════════════════════╤═══════╤══════════════╤═══════════════╤════════════╗
║ Name                                                                 │ Count │ Request Size │ Response Size │ Total Time ║
╟──────────────────────────────────────────────────────────────────────┼───────┼──────────────┼───────────────┼────────────╢
║ REST.GET    https://api.example.com/restful/api/Ticket               │ 368   │ -1 B         │ 85 B          │ 370ms      ║
╟──────────────────────────────────────────────────────────────────────┼───────┼──────────────┼───────────────┼────────────╢
║ REST.GET    https://api.example.com/restful/api/Receipt              │ 368   │ -1 B         │ 89 B          │ 410ms      ║
╟──────────────────────────────────────────────────────────────────────┼───────┼──────────────┼───────────────┼────────────╢
║ REST.POST   https://remote.example.com/api/command.ns                │ 3     │ -1 B         │ 195 B         │ 764ms      ║
╚══════════════════════════════════════════════════════════════════════╧═══════╧══════════════╧═══════════════╧════════════╝
```

**Sort Fields**
*   **name** - The Apex callout name
*   **count** - The number of times the callout was called
*   **request** - The average request size
*   **response** - The average response size
*   **time** - The average execution time


### Apex Execution
Reporting based on ApexExecution data

```bash
eventmonitoring report apexexecution
```

```text
╔══════════════════════════════════════════════╤═══════╤══════════╤══════════╤════════════════╤═══════════════╤══════════════╤════════════╗
║ Entry Point                                  │ Count │ CPU Time │ Run Time │ Execution Time │ DB Total Time │ Callout Time │ SOQL Count ║
╟──────────────────────────────────────────────┼───────┼──────────┼──────────┼────────────────┼───────────────┼──────────────┼────────────╢
║ common.apex.soap.impl.ApexObjectDeserializer │ 43616 │ 2ms      │ 3ms      │ 1ms            │ 0ms           │ 0ms          │ 0          ║
╟──────────────────────────────────────────────┼───────┼──────────┼──────────┼────────────────┼───────────────┼──────────────┼────────────╢
║ VFRemote- CaseViewV2 invoke(fetchCase)       │ 6094  │ 237ms    │ 322ms    │ 58ms           │ 1ms           │ 0ms          │ 8          ║
╟──────────────────────────────────────────────┼───────┼──────────┼──────────┼────────────────┼───────────────┼──────────────┼────────────╢
║ VF- /apex/CaseTag                            │ 2553  │ 232ms    │ 293ms    │ 212ms          │ 1ms           │ 0ms          │ 2.13       ║
╟──────────────────────────────────────────────┼───────┼──────────┼──────────┼────────────────┼───────────────┼──────────────┼────────────╢
║ TEPAPI.runBatchJob                           │ 2461  │ 67ms     │ 503ms    │ 28ms           │ 1ms           │ 123ms        │ 3.86       ║
╟──────────────────────────────────────────────┼───────┼──────────┼──────────┼────────────────┼───────────────┼──────────────┼────────────╢
║ VFRemote- CaseViewV2 invoke(caseUpdateList)  │ 1632  │ 374ms    │ 593ms    │ 72ms           │ 1ms           │ 0ms          │ 12.49      ║
╚══════════════════════════════════════════════╧═══════╧══════════╧══════════╧════════════════╧═══════════════╧══════════════╧════════════╝
```

**Sort Fields**
*   **name** - The Apex entry
*   **count** - The number of times the entry was called
*   **cpu** - The average time spent on the CPU
*   **run** - The average run time
*   **exec** - The average execution time
*   **dbtotal** - The average total database CPU time
*   **callout** - The average callout time
*   **soql** - The average number of SOQL calls

### Apex Soap
Reporting based on ApexSoap data

```bash
eventmonitoring report apexsoap
```

```text
╔══════════════════════════════════╤═══════╤══════════╤══════════╤═════════════════════╤═══════════════╗
║ Name                             │ Count │ CPU Time │ Run Time │ Usage Percent Limit │ DB Total Time ║
╟──────────────────────────────────┼───────┼──────────┼──────────┼─────────────────────┼───────────────╢
║ CaseAPI.listAttachments          │ 8525  │ 179ms    │ 261ms    │ 45.13%              │ 57ms          ║
╟──────────────────────────────────┼───────┼──────────┼──────────┼─────────────────────┼───────────────╢
║ CaseAPI.getCase                  │ 8404  │ 359ms    │ 521ms    │ 45.12%              │ 102ms         ║
╟──────────────────────────────────┼───────┼──────────┼──────────┼─────────────────────┼───────────────╢
║ AccountAPI.getContactsForAccount │ 7777  │ 195ms    │ 289ms    │ 45.13%              │ 53ms          ║
╟──────────────────────────────────┼───────┼──────────┼──────────┼─────────────────────┼───────────────╢
║ AccountAPI.getAccount            │ 7609  │ 152ms    │ 224ms    │ 45.13%              │ 42ms          ║
╟──────────────────────────────────┼───────┼──────────┼──────────┼─────────────────────┼───────────────╢
║ ProductAPI.listVersions          │ 2787  │ 68ms     │ 113ms    │ 45.25%              │ 29ms          ║
╚══════════════════════════════════╧═══════╧══════════╧══════════╧═════════════════════╧═══════════════╝
```

**Sort Fields**
*   **name** - The name of the SOAP endpoint
*   **count** - The number of times the endpoint was called
*   **cpu** - The average time spent on the CPU
*   **run** - The average run time
*   **limit** - The average percentage of SOAP calls made against the org limit (probably not all that useful)
*   **dbtotal** - The average total database CPU time

### Apex Trigger
Reporting based on ApexTrigger data

```bash
eventmonitoring report apextrigger
```

```text
╔═══════════════════════════════╤═══════╤════════════════╗
║ Name                          │ Count │ Execution Time ║
╟───────────────────────────────┼───────┼────────────────╢
║ CaseAfter.AfterUpdate         │ 2761  │ 342ms          ║
╟───────────────────────────────┼───────┼────────────────╢
║ CaseBefore.BeforeUpdate       │ 2761  │ 195ms          ║
╟───────────────────────────────┼───────┼────────────────╢
║ Outgoing_Message.AfterInsert  │ 1990  │ 3ms            ║
╟───────────────────────────────┼───────┼────────────────╢
║ Outgoing_Message.BeforeInsert │ 1990  │ 11ms           ║
╟───────────────────────────────┼───────┼────────────────╢
║ CaseHistory.AfterInsert       │ 1262  │ 218ms          ║
╚═══════════════════════════════╧═══════╧════════════════╝
```

**Sort Fields**
*   **name** - The name of the trigger
*   **count** - The number of times the trigger was called
*   **exec** - The average execution time

### Report
Reporting based on Report data
```bash
eventmonitoring report report --limit 5 --sort cpu
```

```text
╔════════════════════════════╤═════════════════╤═══════╤══════════╤══════════╤══════════╤═════════════╤═══════════╗
║ Name                       │ Id              │ Count │ CPU Time │ Run Time │ DB Time  │ DB CPU Time │ Row Count ║
╟────────────────────────────┼─────────────────┼───────┼──────────┼──────────┼──────────┼─────────────┼───────────╢
║ DELETE FROM YOUR DASHBOARD │ 00OA0000004abcd │ 1     │ 1.9s     │ 12s      │ 10.9s    │ 10.7s       │ 1243006   ║
╟────────────────────────────┼─────────────────┼───────┼──────────┼──────────┼──────────┼─────────────┼───────────╢
║ Case Comment Report        │ 00OA0000006abcd │ 1     │ 643ms    │ 29.8s    │ 29.2s    │ 1.4s        │ 4394      ║
╟────────────────────────────┼─────────────────┼───────┼──────────┼──────────┼──────────┼─────────────┼───────────╢
║ 00OA0000006efgh            │ 00OA0000006efgh │ 1     │ 539ms    │ 8s       │ 7.5s     │ 970ms       │ 4613      ║
╟────────────────────────────┼─────────────────┼───────┼──────────┼──────────┼──────────┼─────────────┼───────────╢
║ 00OA0000006ijkl            │ 00OA0000006ijkl │ 1     │ 503ms    │ 7.9s     │ 7.5s     │ 1.6s        │ 16624     ║
╟────────────────────────────┼─────────────────┼───────┼──────────┼──────────┼──────────┼─────────────┼───────────╢
║ 00OA0000006mnop            │ 00OA0000006mnop │ 3     │ 487ms    │ 2m 25.9s │ 2m 24.9s │ 2m 22.7s    │ NaN       ║
╚════════════════════════════╧═════════════════╧═══════╧══════════╧══════════╧══════════╧═════════════╧═══════════╝
```

**Sort Fields**
*   **name** - The name of the report
*   **id** - The id of the report
*   **count** - The number of times the endpoint was called
*   **cpu** - The average time spent on the CPU
*   **run** - The average run time
*   **dbcpu** - The average database CPU time
*   **dbtotal** - The average total database CPU time
*   **rowcount** - The average number of rows returned in the report


### Visualforce
Reporting based on Visualforce data

```bash
eventmonitoring report visualforce
```

```text
╔═════════════════════════════════════════╤═══════╤══════════╤══════════╤═════════════════╤═══════════════╤═════════════╤═══════════════╗
║ URI                                     │ Count │ CPU Time │ Run Time │ View State Size │ Response Size │ DB CPU Time │ DB Total Time ║
╟─────────────────────────────────────────┼───────┼──────────┼──────────┼─────────────────┼───────────────┼─────────────┼───────────────╢
║ /apex/CaseTag                           │ 2951  │ 229ms    │ 286ms    │ 20.5 kB         │ 65.5 kB       │ 18ms        │ 35ms          ║
╟─────────────────────────────────────────┼───────┼──────────┼──────────┼─────────────────┼───────────────┼─────────────┼───────────────╢
║ /apex/Chat_Hidden                       │ 1739  │ 11ms     │ 25ms     │ 0 B             │ 105 B         │ 3ms         │ 11ms          ║
╟─────────────────────────────────────────┼───────┼──────────┼──────────┼─────────────────┼───────────────┼─────────────┼───────────────╢
║ /apex/Case_View                         │ 1529  │ 901ms    │ 1.7s     │ 39.8 kB         │ 241 kB        │ 179ms       │ 415ms         ║
╟─────────────────────────────────────────┼───────┼──────────┼──────────┼─────────────────┼───────────────┼─────────────┼───────────────╢
║ /apex/NegotiatedEntitlementProcess_View │ 216   │ 177ms    │ 467ms    │ 8.03 kB         │ 22.1 kB       │ 165ms       │ 270ms         ║
╟─────────────────────────────────────────┼───────┼──────────┼──────────┼─────────────────┼───────────────┼─────────────┼───────────────╢
║ /apex/Case_Edit                         │ 172   │ 649ms    │ 1.3s     │ 7.16 kB         │ 63.1 kB       │ 330ms       │ 580ms         ║
╚═════════════════════════════════════════╧═══════╧══════════╧══════════╧═════════════════╧═══════════════╧═════════════╧═══════════════╝
```

**Sort Fields**
*   **name** - The URI of the Visualforce page
*   **count** - The number of times the page was accessed
*   **cpu** - The average time spent on CPU
*   **run** - The average run time
*   **view** - The average view state size
*   **response** - The average response state size
*   **dbcpu** - The average database CPU time
*   **dbtotal** - The average total database CPU time

# Advanced Usage
## Helpers

_Currently only supported by the report command_

The **--helper** flag allows you to pass in a javascript file and provide your own formatter and filterer.

```bash
eventmonitoring report visualforce --sort cpu --helper /path/to/helper.js
```

```javascript
/**
* Format incoming data
* @param {string} field_name The field name being outputted
* @param {object} data The data to be formatted
* @return {string} The formatted data
* @throws An error if it's not a field we're formatting
*/
var formatter = function (field_name, data) {
    if (field_name !== 'count') {
        throw new Error('Unhandled field');
    }

    return 'Custom ' + data;
};

/**
* Returns true if the data should be included
* @param {object} data The data to check
* @returns {boolean} If the data should be included
*/
var filter = function (data) {
    if (data.view < 80) {
        return false;
    }

    return true;
};

module.exports = {
    formatter: formatter,
    filter: filter
};
```

```text
╔═════════════════════════════════════╤════════════╤══════════╤══════════╤═════════════════╤═══════════════╤═════════════╤═══════════════╗
║ URI                                 │ Count      │ CPU Time │ Run Time │ View State Size │ Response Size │ DB CPU Time │ DB Total Time ║
╟─────────────────────────────────────┼────────────┼──────────┼──────────┼─────────────────┼───────────────┼─────────────┼───────────────╢
║ /apex/Account_View                  │ Custom 4   │ 995ms    │ 2.9s     │ 52.1 kB         │ 475 kB        │ 368ms       │ 1.6s          ║
╟─────────────────────────────────────┼────────────┼──────────┼──────────┼─────────────────┼───────────────┼─────────────┼───────────────╢
║ /apex/Case_View                     │ Custom 811 │ 868ms    │ 1.5s     │ 39.2 kB         │ 241 kB        │ 160ms       │ 352ms         ║
╟─────────────────────────────────────┼────────────┼──────────┼──────────┼─────────────────┼───────────────┼─────────────┼───────────────╢
║ /apex/Case_Edit                     │ Custom 45  │ 696ms    │ 1.3s     │ 7.98 kB         │ 70.2 kB       │ 333ms       │ 540ms         ║
╟─────────────────────────────────────┼────────────┼──────────┼──────────┼─────────────────┼───────────────┼─────────────┼───────────────╢
║ /apex/Escalation_View               │ Custom 19  │ 315ms    │ 479ms    │ 15.3 kB         │ 102 kB        │ 68ms        │ 144ms         ║
╟─────────────────────────────────────┼────────────┼──────────┼──────────┼─────────────────┼───────────────┼─────────────┼───────────────╢
║ /apex/casetag                       │ Custom 3   │ 298ms    │ 470ms    │ 13.9 kB         │ 44.2 kB       │ 104ms       │ 140ms         ║
╚═════════════════════════════════════╧════════════╧══════════╧══════════╧═════════════════╧═══════════════╧═════════════╧═══════════════╝
```