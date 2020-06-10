/**
 *
 */
export const MSECS_IN_DAY = 24 * 60 * 60 * 1000;

export const ISO8601_DATE_FORMAT = "yyyy-MM-dd";

// Salesforce always returns Datetime value in iso8601 with zero timezone offset (+0000)
export const ISO8601_DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSSZZZ";

// it should append milliseconds, time zone for parsing valid datetime.
export const ISO8601_DATETIME_INPUT_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";

export const SALESFORCE_DATETIME_INPUT_FORMAT = "yyyy-MM-dd HH:mm:ss";

export const SALESFORCE_TIME_FORMAT = "HH:mm:ss.SSS'Z'";

export const SALESFORCE_TIME_INPUT_FORMAT = "HH:mm:ss.SSS";
