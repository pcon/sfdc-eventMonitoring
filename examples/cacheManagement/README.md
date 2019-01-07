# Manage Cache

These example scripts manage the cache files

## Prerequisites
1.  [eventmonitoring](https://www.npmjs.com/package/sfdc-eventmonitoring) installed

## Usage
I found that this is most useful when run via cron to clear out your cache from the day before.  The example below will run at 1:01am

1.  Create a directory for the script to live in.  (eg `$HOME/eventmonitoring/scripts/cacheManagement/`)
2.  Download the `clearOldCache.sh` file into that directory
4.  Add to cron
    ```text
    1 1 * * * sh /home/username/eventmonitoring/scripts/cacheManagement/clearOldCache.sh
    ```