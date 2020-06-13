import jsforce, { Connection } from "jsforce";

/**
 *
 */
let _conn: Promise<Connection>;

let _loggedIn: Promise<any>;

async function createConnection() {
  const conn = process.env.SF_CONNECTION_NAME
    ? await jsforce.registry.getConnection(process.env.SF_CONNECTION_NAME)
    : new jsforce.Connection();
  if (!conn) {
    throw new Error("Cannot lookup connection from registry");
  }
  conn.metadata.pollInterval = 5000;
  conn.metadata.pollTimeout = 120000;
  return conn;
}

export async function getConnection() {
  if (!_conn) {
    _conn = createConnection();
  }
  const conn = await _conn;
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
