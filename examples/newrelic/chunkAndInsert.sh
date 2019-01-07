#!/bin/bash

command -v jq > /dev/null 2>&1 || { echo >&2 "jq required but not installed.  Aborting."; exit 1; }

if [ -z "$NEWRELIC_INSERT_KEY" ]
then
	{ echo >&2 "NEWRELIC_INSERT_KEY is not set.  Aborting."; exit 1;}
fi

if [ -z "$NEWRELIC_QUERY_KEY" ]
then
	{ echo >&2 "NEWRELIC_QUERY_KEY is not set.  Aborting."; exit 1;}
fi

if [ -z "$NEWRELIC_ACCOUNT_ID" ]
then
	{ echo >&2 "NEWRELIC_ACCOUNT_ID is not set.  Aborting."; exit 1;}
fi

FILE=$1

if [ ! -f $FILE ]
then
	{ echo >&2 "$FILE does not exist.  Aborting."; exit 1;}
fi

CHUNK_SIZE=1500
START=0

echo "$FILE"
RECORD_SIZE=`cat $FILE | jq 'length'`

echo "$RECORD_SIZE"

while [ $START -lt $RECORD_SIZE ]
do
	END=$[$START + CHUNK_SIZE]
	cat $FILE | \
		jq ".[$START:$END]" | \
		curl -s -d @- -X POST -H "Content-Type: application/json" -H "X-Insert-Key: $NEWRELIC_INSERT_KEY" \
			https://insights-collector.newrelic.com/v1/accounts/$NEWRELIC_ACCOUNT_ID/events
	START=$END
done