import jsforce, { Connection } from 'jsforce';

/**
 * 
 */
let _conn: Promise<Connection | null>;

let _loggedIn: Promise<any>;

async function lookupConnection() {
  if (!_conn) {
    _conn = process.env.SF_CONNECTION_NAME ?
      jsforce.registry.getConnection(process.env.SF_CONNECTION_NAME) :
      Promise.resolve(new jsforce.Connection());
  }
  const conn = await _conn;
  if (!conn) {
    throw new Error('cannot get connection from registry');
  }
  conn.version = '42.0';
  conn.metadata.pollInterval = 5000;
  conn.metadata.pollTimeout = 60000;
  if (_loggedIn) {
    if (process.env.SF_USERNAME && process.env.SF_PASSWORD) {
      _loggedIn = conn.login(process.env.SF_USERNAME, process.env.SF_PASSWORD);
    } else {
      _loggedIn = conn.identity();
    }
  }
  return conn;
}

export async function getConnection() {
  const conn = await lookupConnection();
  await _loggedIn;
  return conn;
}
