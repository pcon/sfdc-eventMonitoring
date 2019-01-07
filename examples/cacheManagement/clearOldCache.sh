#!/bin/bash

# Clears the cache before today

function checkCommand() {
	command -v $1 > /dev/null 2>&1 || { echo >&2 "$1 required but not installed.  Aborting."; exit 1; }
}

checkCommand date
checkCommand eventmonitoring

EPOCH=`date --date=@0 +%Y-%m-%d`
YESTERDAY=`date --date="yesterday" +%Y-%m-%d`

eventmonitoring --debug cache clear --start "$EPOCH" --end "$YESTERDAY"