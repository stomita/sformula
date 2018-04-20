/* @flow */
import jsforce from 'jsforce';

/**
 * 
 */
const _conn =
  process.env.SF_CONNECTION_NAME ?
  jsforce.registry.getConnection(process.env.SF_CONNECTION_NAME) :
  new jsforce.Connection();

_conn.version = '42.0';
_conn.metadata.pollInterval = 5000;
_conn.metadata.pollTimeout = 60000;
_conn.bulk.pollInterval = 5000;
_conn.bulk.pollTimeout = 60000;

let _loggedIn
if (process.env.SF_USERNAME && process.env.SF_PASSWORD) {
  _loggedIn = _conn.login(process.env.SF_USERNAME, process.env.SF_PASSWORD);
} else {
  _loggedIn = _conn.identity();
}

export async function getConnection() {
  await _loggedIn;
  return _conn;
}
