command -v jq > /dev/null 2>&1 || { echo >&2 "jq required but not installed.  Aborting."; exit 1; }
command -v eventmonitoring > /dev/null 2>&1 || { echo >&2 "eventmonitoring required but not installed.  Aborting."; exit 1; }

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

lasttimestamp=`curl -s -H "Accept: application/json" -H "X-Query-Key: $NEWRELIC_QUERY_KEY" \
	"https://insights-api.newrelic.com/v1/accounts/$NEWRELIC_ACCOUNT_ID/query?nrql=select+max(timestamp)+from+ApexSoap+since+6+hours+ago" | \
	jq '.results[0].max'`

eventmonitoring dump --type ApexSoap --format json -d --logformat=bunyan --logfile $LOG_FILE | \
	jq --arg lasttimestamp $lasttimestamp -f jq_transform_apexSoap | \
	curl -d @- -X POST -H "Content-Type: application/json" -H "X-Insert-Key: $NEWRELIC_INSERT_KEY" \
		https://insights-collector.newrelic.com/v1/accounts/$NEWRELIC_ACCOUNT_ID/events