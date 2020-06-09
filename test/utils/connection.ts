import jsforce, { Connection } from "jsforce";

/**
 *
 */
let _conn: Promise<Connection>;

let _loggedIn: Promise<any>;

export async function getConnection() {
  if (!_conn) {
    _conn = process.env.SF_CONNECTION_NAME
      ? jsforce.registry
          .getConnectionConfig(process.env.SF_CONNECTION_NAME)
          .then((config) => new jsforce.Connection(config ?? {}))
      : Promise.resolve(new jsforce.Connection());
  }
  const conn = await _conn;
  conn.metadata.pollInterval = 5000;
  conn.metadata.pollTimeout = 60000;
  if (!_loggedIn) {
    if (process.env.SF_USERNAME && process.env.SF_PASSWORD) {
      _loggedIn = conn.login(process.env.SF_USERNAME, process.env.SF_PASSWORD);
    } else {
      _loggedIn = conn.identity();
    }
  }
  await _loggedIn;
  return conn;
}
