var lo = require('lodash');

var CONNECTION = {
    SANDBOX_URL: 'https://test.salesforce.com',
    PROD_URL: 'https://login.salesforce.com',
    VERSION: '43.0'
};

var CONFIG = {
    asc: {
        default: false,
        describe: 'Sort the data in ascending order',
        type: 'boolean'
    },
    sort: {
        default: 'count',
        describe: 'The field to sort by.  Use a comma seperated list to sort by multiple fields',
        type: 'string'
    },
    limit: {
        describe: 'The number of results to limit to',
        type: 'number'
    },
    maxversion: {
        default: undefined,
        describe: 'The max version to display',
        type: 'number'
    },
    summary: {
        describe: 'Summarize the data',
        type: 'boolean'
    },

    env: {
        alias: 'e',
        describe: 'The envirionment name',
        type: 'string'
    },
    username: {
        alias: 'u',
        describe: 'The Salesforce username',
        type: 'string'
    },
    password: {
        alias: 'p',
        describe: 'The Salesforce password',
        type: 'string'
    },
    token: {
        alias: 't',
        describe: 'The Salesforce token',
        type: 'string'
    },
    sandbox: {
        describe: 'The Salesforce instance is a sandbox',
        type: 'boolean'
    },
    solenopsis: {
        describe: 'User solenopsis configs for environments',
        type: 'boolean',
        default: undefined
    },
    cache: {
        describe: 'The directory to cache the event logs',
        type: 'string'
    },
    interval: {
        default: 'hourly',
        describe: 'The interval to use',
        type: 'string',
        choices: [ 'hourly', 'daily' ]
    },
    latest: {
        default: true,
        describe: 'Use the most recent data',
        type: 'boolean'
    },
    start: {
        describe: 'The start date/time to get (in GMT)',
        type: 'string'
    },
    end: {
        describe: 'The end date/time to get (in GMT)',
        type: 'string'
    },
    date: {
        describe: 'The day to get (in GMT)',
        type: 'string'
    },
    helper: {
        describe: 'The local helper to use',
        type: 'string'
    },
    debug: {
        alias: 'd',
        describe: 'Enable debug logging',
        type: 'boolean'
    }
};

var DATETIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss.000\\Z';
var DATE_FORMAT = 'YYYY-MM-DD';

var LOGIN_STATUS = {
    'LOGIN_CHALLENGE_ISSUED': 'Failed: Computer activation required',
    'LOGIN_CHALLENGE_PENDING': 'Failed: Computer activation pending',
    'LOGIN_DATA_DOWNLOAD_ONLY': undefined,
    'LOGIN_END_SESSION_TXN_SECURITY_POLICY': undefined,
    'LOGIN_ERROR_APPEXCHANGE_DOWN': 'Unable to process your login request',
    'LOGIN_ERROR_ASYNC_USER_CREATE': undefined,
    'LOGIN_ERROR_AVANTGO_DISABLED': undefined,
    'LOGIN_ERROR_AVANTGO_TRIAL_EXP': undefined,
    'LOGIN_ERROR_CLIENT_NO_ACCESS': undefined,
    'LOGIN_ERROR_CLIENT_REQ_UPDATE': 'Failed: Client update required',
    'LOGIN_ERROR_CSS_FROZEN': undefined,
    'LOGIN_ERROR_CSS_PW_LOCKOUT': undefined,
    'LOGIN_ERROR_DUPLICATE_USERNAME': undefined,
    'LOGIN_ERROR_EXPORT_RESTRICTED': 'Restricted country',
    'LOGIN_ERROR_GLOBAL_BLOCK_DOMAIN': 'Restricted domain',
    'LOGIN_ERROR_HT_DOWN': undefined,
    'LOGIN_ERROR_HTP_METHD_INVALID': 'Failed: Invalid HTTP method',
    'LOGIN_ERROR_INSECURE_LOGIN': ' Failed: Login over insecure channel',
    'LOGIN_ERROR_INVALID_GATEWAY': 'Invalid gateway',
    'LOGIN_ERROR_INVALID_ID_FIELD': undefined,
    'LOGIN_ERROR_INVALID_PASSWORD': 'Invalid password',
    'LOGIN_ERROR_INVALID_USERNAME': 'Invalid login',
    'LOGIN_ERROR_LOGINS_EXCEEDED': 'Maximum logins exceeded',
    'LOGIN_ERROR_MUST_USE_API_TOKEN': 'Failed: API security token required',
    'LOGIN_ERROR_MUTUAL_AUTHENTICATION': 'Mutual authentication failed',
    'LOGIN_ERROR_NETWORK_INACTIVE': 'Invalid - community offline',
    'LOGIN_ERROR_NO_HT_ACCESS': undefined,
    'LOGIN_ERROR_NO_NETWORK_ACCESS': 'No community access',
    'LOGIN_ERROR_NO_NETWORK_INFO': undefined,
    'LOGIN_ERROR_NO_PORTAL_ACCESS': 'Invalid profile association',
    'LOGIN_ERROR_NO_SET_COOKIES': undefined,
    'LOGIN_ERROR_OFFLINE_DISABLED': 'Offline disabled',
    'LOGIN_ERROR_OFFLINE_TRIAL_EXP': 'Offline trial expired',
    'LOGIN_ERROR_ORG_CLOSED': 'Organization closed',
    'LOGIN_ERROR_ORG_DOMAIN_ONLY': 'Restricted domain',
    'LOGIN_ERROR_ORG_IN_MAINTENANCE': 'Organization is in maintenance',
    'LOGIN_ERROR_ORG_INACTIVE': 'Organization is inactive',
    'LOGIN_ERROR_ORG_IS_DOT_ORG': 'Organization is a DOT',
    'LOGIN_ERROR_ORG_LOCKOUT': 'Organization locked',
    'LOGIN_ERROR_ORG_SIGNING_UP': undefined,
    'LOGIN_ERROR_ORG_SUSPENDED': 'Organization suspended',
    'LOGIN_ERROR_OUTLOOK_DISABLED': 'Outlook integration disabled',
    'LOGIN_ERROR_PAGE_REQUIRES_LOGIN': undefined,
    'LOGIN_ERROR_PASSWORD_EMPTY': undefined,
    'LOGIN_ERROR_PASSWORD_LOCKOUT': 'Password lockout',
    'LOGIN_ERROR_PORTAL_INACTIVE': 'Invalid - Portal disabled',
    'LOGIN_ERROR_RATE_EXCEEDED': 'Login rate exceeded',
    'LOGIN_ERROR_RESTRICTED_DOMAIN': 'Restricted IP',
    'LOGIN_ERROR_RESTRICTED_TIME': 'Restricted time',
    'LOGIN_ERROR_SESSION_TIMEOUT': undefined,
    'LOGIN_ERROR_SSO_PWD_INVALID': 'Invalid password',
    'LOGIN_ERROR_SSO_SVC_DOWN': 'Your company\'s authentication service is down',
    'LOGIN_ERROR_SSO_URL_INVALID': 'The Single Sign-On Gateway URL is invalid',
    'LOGIN_ERROR_STORE': undefined,
    'LOGIN_ERROR_STORE_DOWN': undefined,
    'LOGIN_ERROR_SWITCH_SFDC_INSTANCE': undefined,
    'LOGIN_ERROR_SWITCH_SFDC_LOGIN': undefined,
    'LOGIN_ERROR_SYNCOFFLINE_DISBLD': 'Failed: Mobile disabled',
    'LOGIN_ERROR_SYSTEM_DOWN': undefined,
    'LOGIN_ERROR_UNKNOWN_ERROR': 'Login invalid',
    'LOGIN_ERROR_USER_API_ONLY': 'Failed: API-only user',
    'LOGIN_ERROR_USER_FROZEN': 'User is frozen',
    'LOGIN_ERROR_USER_INACTIVE': 'User is inactive',
    'LOGIN_ERROR_USER_NON_MOBILE': 'Failed: Mobile license required',
    'LOGIN_ERROR_USER_STORE_ACCESS': undefined,
    'LOGIN_ERROR_USERNAME_EMPTY': undefined,
    'LOGIN_ERROR_WIRELESS_DISABLED': 'Wireless disabled',
    'LOGIN_ERROR_WIRELESS_TRIAL_EXP': 'Wireless trial expired',
    'LOGIN_LIGHTNING_LOGIN': 'Lightning Login required',
    'LOGIN_NO_ERROR': undefined,
    'LOGIN_OAUTH_API_DISABLED': 'Failed: OAuth API access disabled',
    'LOGIN_OAUTH_CONSUMER_DELETED': 'Failed: Consumer Deleted',
    'LOGIN_OAUTH_DS_NOT_EXPECTED': 'Failed: Activation secret not expected',
    'LOGIN_OAUTH_EXCEED_GET_AT_LMT': 'Failed: Get Access Token Limit Exceeded',
    'LOGIN_OAUTH_INVALID_CODE_CHALLENGE': 'Failed: Invalid Code Challenge',
    'LOGIN_OAUTH_INVALID_CODE_VERIFIER': 'Failed: Invalid Code Verifier',
    'LOGIN_OAUTH_INVALID_DEVICE': 'Failed: Device Id missing or not registered',
    'LOGIN_OAUTH_INVALID_DS': 'Failed: Activation secret invalid',
    'LOGIN_OAUTH_INVALID_DSIG': 'Failed: Signature Invalid',
    'LOGIN_OAUTH_INVALID_IP': 'Failed: IP Address Not Allowed',
    'LOGIN_OAUTH_INVALID_NONCE': 'Failed: Invalid Nonce',
    'LOGIN_OAUTH_INVALID_SIG_METHOD': ' Failed: Invalid Signature Method',
    'LOGIN_OAUTH_INVALID_TIMESTAMP': 'Failed: Invalid Timestamp',
    'LOGIN_OAUTH_INVALID_TOKEN': '  Failed: Invalid Token',
    'LOGIN_OAUTH_INVALID_VERIFIER': 'Failed: Invalid Verifier',
    'LOGIN_OAUTH_INVALID_VERSION': 'Failed: Version Not Supported',
    'LOGIN_OAUTH_MISSING_DS': ' Activation secret missing',
    'LOGIN_OAUTH_NO_CALLBACK_URL': 'Failed: Invalid Callback URL',
    'LOGIN_OAUTH_NO_CONSUMER': 'Missing Consumer Key Parameter',
    'LOGIN_OAUTH_NO_TOKEN': 'Missing OAuth Token Parameter',
    'LOGIN_OAUTH_NONCE_REPLAY': 'Failed: Nonce Replay Detected',
    'LOGIN_OAUTH_PACKAGE_MISSING': 'Package for this consumer is not installed in your organization',
    'LOGIN_OAUTH_PACKAGE_OLD': 'Installed package for this consumer is out of date',
    'LOGIN_OAUTH_UNEXPECTED_PARAM': 'Failed: Unexpected parameter',
    'LOGIN_ORG_TRIAL_EXP': 'Trial Expired',
    'LOGIN_READONLY_CANNOT_VALIDATE': undefined,
    'LOGIN_SAML_INVALID_AUDIENCE': 'Failed: Audience Invalid',
    'LOGIN_SAML_INVALID_CONFIG': 'Failed: Configuration Error/Perm Disabled',
    'LOGIN_SAML_INVALID_FORMAT': 'Failed: Assertion Invalid',
    'LOGIN_SAML_INVALID_IN_RES_TO': 'Failed: InResponseTo Invalid',
    'LOGIN_SAML_INVALID_ISSUER': 'Failed: Issuer Mismatched',
    'LOGIN_SAML_INVALID_ORG_ID': 'Failed: Invalid Organization Id',
    'LOGIN_SAML_INVALID_PORTAL_ID': 'Failed: Invalid Portal Id',
    'LOGIN_SAML_INVALID_RECIPIENT': 'Failed: Recipient Mismatched',
    'LOGIN_SAML_INVALID_SESSION_LEVEL': undefined,
    'LOGIN_SAML_INVALID_SIGNATURE': 'Failed: Signature Invalid',
    'LOGIN_SAML_INVALID_SITE_URL': 'Failed: Invalid Site URL',
    'LOGIN_SAML_INVALID_STATUS': 'Failed: Status Invalid',
    'LOGIN_SAML_INVALID_SUB_CONFIRM': 'Failed: Subject Confirmation Error',
    'LOGIN_SAML_INVALID_TIMESTAMP': 'Failed: Assertion Expired',
    'LOGIN_SAML_INVALID_USERNAME': 'Failed: Username Or SSO Id Invalid',
    'LOGIN_SAML_INVALID_VERSION': undefined,
    'LOGIN_SAML_MISMATCH_CERT': 'Failed: Signature Invalid/Configured Certificate Mismatch',
    'LOGIN_SAML_MISSING_ORG_ID': 'Failed: Missing Organization Id for Portal login',
    'LOGIN_SAML_MISSING_PORTAL_ID': 'Failed: Missing Portal Id',
    'LOGIN_SAML_PROVISION_ERROR': 'Failed: SAML Provision Error',
    'LOGIN_SAML_REPLAY_ATTEMPTED': 'Failed: Replay Detected',
    'LOGIN_SAML_SITE_INACTIVE': 'Failed: Specified Site is Inactive',
    'LOGIN_TWOFACTOR_REQ': 'Two-factor required'
};

var LOG_TYPES = [
    'ApexCallout',
    'ApexExecution',
    'ApexSoap',
    'ApexTrigger',
    'API',
    'AsyncReportRun',
    'BulkAPI',
    'ChangesetOperation',
    'Console',
    'ContentDistribution',
    'ContentDocument',
    'ContentTransfer',
    'ContinuationCalloutSummary',
    'Dashboard',
    'DocumentAttach',
    'ExternalCrossorgCallout',
    'ExternaloDataCallout',
    'ExternalCustomApexCallout',
    'InsecureExternalAssets',
    'KnowledgeArticleView',
    'LightningError',
    'LightningInteraction',
    'LightningPageView',
    'LightningPerformance',
    'Login',
    'LoginAs',
    'Logout',
    'MetadataAPI',
    'Multiblock',
    'PackageInstall',
    'PlatformEncryption',
    'QueuedExec',
    'Report',
    'ReportExport',
    'RestAPI',
    'Sandbox',
    'Search',
    'SearchClick',
    'Sites',
    'TimebasedWorkflow',
    'Transaction',
    'URI',
    'Visualforce',
    'WaveChange',
    'WaveInteraction',
    'WavePerformance'
];

/**
 * Get the message for a given key
 * @param {string} key The key
 * @returns {string} The message or the key if not found
 */
var getMessage = function (key) {
    var messages = LOGIN_STATUS;
    if (
        !lo.has(messages, key) ||
        lo.get(messages, key) === undefined
    ) {
        return key;
    }

    return lo.get(messages, key);
};

var static = {
    CONFIG: CONFIG,
    CONNECTION: CONNECTION,
    DATE_FORMAT: DATE_FORMAT,
    DATETIME_FORMAT: DATETIME_FORMAT,
    getMessage: getMessage,
    LOG_TYPES: LOG_TYPES
};

module.exports = static;