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
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      questions_count INTEGER DEFAULT 0,
      answers_count INTEGER DEFAULT 0,
      reputation INTEGER DEFAULT 0
    );
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT,
      question_id TEXT,
      query_id TEXT,
      content TEXT NOT NULL,
      author TEXT DEFAULT 'Community Member',
      votes INTEGER DEFAULT 0,
      is_best INTEGER DEFAULT 0,
      synced_to_mongo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT,
      user_id TEXT DEFAULT 'anonymous',
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      value INTEGER DEFAULT 1,
      synced_to_mongo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, target_type, target_id)
    );
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT,
      user_id TEXT DEFAULT 'anonymous',
      question_id TEXT NOT NULL,
      synced_to_mongo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, question_id)
    );
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT,
      type TEXT NOT NULL,
      user_id TEXT DEFAULT 'anonymous',
      target_type TEXT DEFAULT '',
      target_id TEXT DEFAULT '',
      metadata TEXT DEFAULT '{}',
      synced_to_mongo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check and seed mock events if events table is empty or partially seeded
  try {
    const countObj = await sqliteDb.get("SELECT COUNT(*) as count FROM events");
    if (countObj && countObj.count < 1271) {
      if (countObj.count > 0) {
        console.log("Interrupted seeding detected. Resetting and seeding fresh mock events...");
        await sqliteDb.run("DELETE FROM events");
      }
      await seedMockEvents(sqliteDb);
    }
  } catch (seedErr) {
    console.error("Failed to seed mock events:", seedErr.message);
  }

  console.log("SQLite fallback ready");
}

async function seedMockEvents(db) {
  console.log("Seeding mock events for SQLite...");
  const dayMs = 24 * 60 * 60 * 1000;
  const now = Date.now();

  const pattern = [
    { questions: 12, answers: 32, votes: 95 },  // 6 days ago
    { questions: 15, answers: 45, votes: 120 }, // 5 days ago
    { questions: 8,  answers: 28, votes: 85 },  // 4 days ago
    { questions: 22, answers: 58, votes: 160 }, // 3 days ago
    { questions: 31, answers: 79, votes: 210 }, // 2 days ago
    { questions: 19, answers: 42, votes: 130 }, // 1 day ago
    { questions: 7,  answers: 18, votes: 55 }    // today
  ];

  await db.run("BEGIN TRANSACTION");
  try {
    for (let i = 0; i < 7; i++) {
      const daysAgo = 6 - i;
      const date = new Date(now - daysAgo * dayMs);
      const { questions, answers, votes } = pattern[i];

      // Seed questions
      for (let q = 0; q < questions; q++) {
        const eventDate = new Date(date);
        eventDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
        await db.run(
          `INSERT INTO events (type, user_id, target_type, created_at) VALUES (?, ?, ?, ?)`,
          "question_created",
          "anonymous",
          "query",
          eventDate.toISOString()
        );
      }

      // Seed answers
      for (let a = 0; a < answers; a++) {
        const eventDate = new Date(date);
        eventDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
        await db.run(
          `INSERT INTO events (type, user_id, target_type, created_at) VALUES (?, ?, ?, ?)`,
          "answer_created",
          "anonymous",
          "answer",
          eventDate.toISOString()
        );
      }

      // Seed votes
      for (let v = 0; v < votes; v++) {
        const eventDate = new Date(date);
        eventDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
        await db.run(
          `INSERT INTO events (type, user_id, target_type, created_at) VALUES (?, ?, ?, ?)`,
          "vote_created",
          "anonymous",
          "answer",
          eventDate.toISOString()
        );
      }
    }
    await db.run("COMMIT");
    console.log("Mock events seeding completed successfully.");
  } catch (err) {
    await db.run("ROLLBACK");
    throw err;
  }
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
