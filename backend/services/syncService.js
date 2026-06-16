const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const UserQuery = require("../models/UserQuery");
const FAQ = require("../models/FAQ");
const User = require("../models/User");

function extractKeywords(text) {
  if (!text) return [];

  const stopWords = new Set([
    "the",
    "is",
    "are",
    "a",
    "an",
    "to",
    "of",
    "for",
    "in",
    "on",
    "and",
    "or",
    "with",
    "how",
    "what",
    "when",
    "where",
    "why",
    "do",
    "does",
    "can",
    "i",
    "we",
    "you"
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .slice(0, 12);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function promoteMongoResolvedQueries() {
  const resolvedQueries = await UserQuery.find({
    status: "resolved",
    promoted: false,
    answer: { $ne: "" }
  });

  for (const query of resolvedQueries) {
    const existingFaq = await FAQ.findOne({
      question: new RegExp(`^${escapeRegex(query.question)}$`, "i")
    });

    if (!existingFaq) {
      await FAQ.create({
        question: query.question,
        answer: query.answer,
        keywords: extractKeywords(`${query.question} ${query.answer}`),
        sourceQueryId: query._id
      });
    }

    query.promoted = true;
    await query.save();
  }
}

async function promoteSQLiteResolvedQueries() {
  const db = getSQLiteDb();

  const resolvedRows = await db.all(`
    SELECT *
    FROM user_queries
    WHERE status = 'resolved'
      AND promoted = 0
      AND answer IS NOT NULL
      AND answer != ''
  `);

  for (const row of resolvedRows) {
    const existingFaq = await db.get(
      `
      SELECT *
      FROM faqs
      WHERE LOWER(question) = LOWER(?)
      `,
      row.question
    );

    if (!existingFaq) {
      const keywords = extractKeywords(`${row.question} ${row.answer}`).join(",");

      await db.run(
        `
        INSERT INTO faqs (
          question,
          answer,
          keywords,
          source_query_id,
          synced_to_mongo
        )
        VALUES (?, ?, ?, ?, 0)
        `,
        row.question,
        row.answer,
        keywords,
        String(row.id)
      );
    }

    await db.run(
      `
      UPDATE user_queries
      SET promoted = 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      row.id
    );
  }
}

async function syncSQLiteToMongo() {
  if (!isMongoAvailable()) return;

  const db = getSQLiteDb();

  // Sync users first so queries can associate correctly if needed
  const unsyncedUsers = await db.all(`
    SELECT *
    FROM users
    WHERE mongo_id IS NULL OR mongo_id = ''
  `);

  for (const row of unsyncedUsers) {
    try {
      const existingUser = await User.findOne({ email: row.email });
      let mongoUser = existingUser;

      if (!existingUser) {
        mongoUser = await User.create({
          name: row.name,
          email: row.email,
          password: row.password_hash,
          questionsCount: row.questions_count,
          answersCount: row.answers_count,
          reputation: row.reputation
        });
      }

      await db.run(
        `
        UPDATE users
        SET mongo_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        String(mongoUser._id),
        row.id
      );
    } catch (syncErr) {
      console.error(`User sync failed for email ${row.email}:`, syncErr.message);
    }
  }

  const unsyncedQueries = await db.all(`
    SELECT *
    FROM user_queries
    WHERE synced_to_mongo = 0
  `);

  for (const row of unsyncedQueries) {
    const existingQuery = await UserQuery.findOne({
      question: new RegExp(`^${escapeRegex(row.question)}$`, "i")
    });

    let mongoQuery = existingQuery;

    if (!existingQuery) {
      mongoQuery = await UserQuery.create({
        question: row.question,
        answer: row.answer || "",
        status: row.status,
        source: row.source || "sqlite-fallback",
        promoted: Boolean(row.promoted)
      });
    }

    await db.run(
      `
      UPDATE user_queries
      SET synced_to_mongo = 1,
          mongo_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      String(mongoQuery._id),
      row.id
    );
  }

  const unsyncedFaqs = await db.all(`
    SELECT *
    FROM faqs
    WHERE synced_to_mongo = 0
  `);

  for (const row of unsyncedFaqs) {
    const existingFaq = await FAQ.findOne({
      question: new RegExp(`^${escapeRegex(row.question)}$`, "i")
    });

    let mongoFaq = existingFaq;

    if (!existingFaq) {
      mongoFaq = await FAQ.create({
        question: row.question,
        answer: row.answer,
        keywords: row.keywords ? row.keywords.split(",") : [],
        sourceQueryId: null
      });
    }

    await db.run(
      `
      UPDATE faqs
      SET synced_to_mongo = 1,
          mongo_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      String(mongoFaq._id),
      row.id
    );
  }
}

async function runSyncPipeline() {
  try {
    await promoteSQLiteResolvedQueries();

    if (isMongoAvailable()) {
      await promoteMongoResolvedQueries();
      await syncSQLiteToMongo();
      await promoteMongoResolvedQueries();
    }
  } catch (error) {
    console.error("Sync pipeline error:", error.message);
  }
}

function startSyncPipeline() {
  const interval = Number(process.env.SYNC_INTERVAL_MS || 30000);

  setInterval(runSyncPipeline, interval);

  console.log(`Sync pipeline started. Interval: ${interval}ms`);
}

module.exports = {
  runSyncPipeline,
  startSyncPipeline,
  extractKeywords
};
