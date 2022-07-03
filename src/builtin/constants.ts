/**
 *
 */
export const MSECS_IN_DAY = 24 * 60 * 60 * 1000;

export const ISO8601_DATE_FORMAT = "YYYY-MM-DD";

// Salesforce always returns Datetime value in iso8601 with zero timezone offset (+0000)
export const ISO8601_DATETIME_FORMAT = "YYYY-MM-DD[T]HH:mm:ss.SSSZZ";

// it should append milliseconds, time zone for parsing valid datetime.
export const ISO8601_DATETIME_INPUT_FORMAT = "YYYY-MM-DD[T]HH:mm:ss";

export const SALESFORCE_DATETIME_TEXT_FORMAT = "YYYY-MM-DD HH:mm:ss";

export const SALESFORCE_DATETIME_TEXT_FORMAT_Z = "YYYY-MM-DD HH:mm:ss[Z]";

export const SALESFORCE_TIME_FORMAT = "HH:mm:ss.SSS[Z]";

export const SALESFORCE_TIME_TEXT_FORMAT = "HH:mm:ss.SSS";
