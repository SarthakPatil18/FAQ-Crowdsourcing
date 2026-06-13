const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

let sqliteDb = null;

async function connectSQLite() {
  sqliteDb = await open({
    filename: process.env.SQLITE_PATH || "./faq_fallback.sqlite",
    driver: sqlite3.Database
  });

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS user_queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT,
      question TEXT NOT NULL,
      answer TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      source TEXT DEFAULT 'frontend',
      promoted INTEGER DEFAULT 0,
      synced_to_mongo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS faqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      keywords TEXT DEFAULT '',
      source_query_id TEXT,
      synced_to_mongo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      followable_type TEXT CHECK(followable_type IN ('question', 'tag')),
      followable_id INTEGER,
      is_muted BOOLEAN DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE (user_id, followable_type, followable_id)
    );
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      follow_id INTEGER,
      message TEXT,
      is_read BOOLEAN DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (follow_id) REFERENCES follows(id)
    );
  `);

  console.log("SQLite fallback ready");
}

function getSQLiteDb() {
  if (!sqliteDb) {
    throw new Error("SQLite database not initialized");
  }

  return sqliteDb;
}

module.exports = {
  connectSQLite,
  getSQLiteDb
};
