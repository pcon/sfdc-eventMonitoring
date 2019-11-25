#!/bin/bash

function checkCommand() {
	command -v $1 > /dev/null 2>&1 || { echo >&2 "$1 required but not installed.  Aborting."; exit 1; }
}

function checkVariable() {
	if [ -z "${!1}" ]
	then
		{ echo >&2 "$1 is not set.  Aborting."; exit 1;}
	fi
}

checkCommand jq
checkCommand eventmonitoring

checkVariable "NEWRELIC_INSERT_KEY"
checkVariable "NEWRELIC_QUERY_KEY"
checkVariable "NEWRELIC_ACCOUNT_ID"
checkVariable "TMP_FILE"
checkVariable "USER_TMP"

lasttimestamp=`curl -s -H "Accept: application/json" -H "X-Query-Key: $NEWRELIC_QUERY_KEY" \
	"https://insights-api.newrelic.com/v1/accounts/$NEWRELIC_ACCOUNT_ID/query?nrql=select+max(timestamp)+from+VisualforceRequest+since+6+hours+ago" | \
	jq '.results[0].max'`

YESTERDAY=`date --date="yesterday" "+%Y-%m-%d"`

if [ ! -f $USER_TMP ]
then
	eventmonitoring utils userdump | jq '. | map({(.Id[:15]): .Username}) | add' > $USER_TMP
fi

eventmonitoring dump --type VisualforceRequest --format json -d --logformat=bunyan --logfile $LOG_FILE --start $YESTERDAY | \
	jq --slurpfile usermap $USER_TMP --arg lasttimestamp $lasttimestamp -f jq_transform_visualforceRequest > $TMP_FILE

sh chunkAndInsert.sh $TMP_FILE
#rm $TMP_FILE