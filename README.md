# Event Monitoring
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

## Report
This sub command is used to report on Event Monitoring data

**Flags**
* **--format [format]** - json, table - The format the output should be displayed in
* **--interval [interval]** - hourly, daily - The interval to use for the data
* **--asc** - Sort the data in ascending order
* **--sort** - The field to sort the data by.  This will vary from report type to report type.
* **--limit [limit]** - The number of results to limit to

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
* **entry** - The Apex entry
* **count** - The number of times the entry was called
* **cpu** - The average time spent on the CPU
* **run** - The average run time
* **exec** - The average execution time
* **dbtotal** - The average total database CPU time
* **callout** - The average callout time
* **soql** - The average number of SOQL calls

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
* **name** - The name of the SOAP endpoint
* **count** - The number of times the endpoint was called
* **cpu** - The average time spent on the CPU
* **run** - The average run time
* **limit** - The average percentage of SOAP calls made against the org limit (probably not all that useful)
* **dbtotal** - The average total database CPU time

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
* **name** - The name of the trigger
* **count** - The number of times the trigger was called
* **exec** - The average execution time

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
* **uri** - The URI of the Visualforce page
* **count** - The number of times the page was accessed
* **cpu** - The average time spent on CPU
* **run** - The average run time
* **view** - The average view state size
* **response** - The average response state size
* **dbcpu** - The average database CPU time
* **dbtotal** - The average total database CPU time