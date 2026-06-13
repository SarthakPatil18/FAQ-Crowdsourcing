const express = require("express");
const router = express.Router();

const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const UserQuery = require("../models/UserQuery");
const { runSyncPipeline } = require("../services/syncService");
const { trackEvent } = require("../services/eventService");

router.post("/", async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || question.trim() === "") {
      return res.status(400).json({
        error: "Question is required"
      });
    }

    if (question.length > 500) {
      return res.status(400).json({
        error: "Question must be 500 characters or less"
      });
    }

    if (answer && answer.length > 3000) {
      return res.status(400).json({
        error: "Answer must be 3000 characters or less"
      });
    }

    if (isMongoAvailable()) {
      const query = await UserQuery.create({
        question: question.trim(),
        answer: answer ? answer.trim() : "",
        status: answer ? "resolved" : "pending",
        source: "frontend"
      });

      await trackEvent({
        type: answer ? "faq_created" : "question_created",
        userId: "anonymous",
        targetType: "query",
        targetId: String(query._id),
        metadata: {
          storage: "mongodb",
          hasAnswer: Boolean(answer)
        }
      });

      await runSyncPipeline();

      return res.status(201).json({
        storage: "mongodb",
        data: query
      });
    }

    const db = getSQLiteDb();

    const result = await db.run(
      `
      INSERT INTO user_queries (
        question,
        answer,
        status,
        source,
        synced_to_mongo
      )
      VALUES (?, ?, ?, ?, 0)
      `,
      question.trim(),
      answer ? answer.trim() : "",
      answer ? "resolved" : "pending",
      "frontend"
    );

    await trackEvent({
      type: answer ? "faq_created" : "question_created",
      userId: "anonymous",
      targetType: "query",
      targetId: String(result.lastID),
      metadata: {
        storage: "sqlite",
        hasAnswer: Boolean(answer)
      }
    });

    await runSyncPipeline();

    return res.status(201).json({
      storage: "sqlite",
      data: {
        id: result.lastID,
        question: question.trim(),
        answer: answer ? answer.trim() : "",
        status: answer ? "resolved" : "pending"
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to save query",
      details: error.message
    });
  }
});

router.get("/", async (req, res) => {
  try {
    if (isMongoAvailable()) {
      const queries = await UserQuery.find().sort({ createdAt: -1 });

      return res.json({
        storage: "mongodb",
        data: queries
      });
    }

    const db = getSQLiteDb();

    const queries = await db.all(`
      SELECT *
      FROM user_queries
      ORDER BY created_at DESC
    `);

    return res.json({
      storage: "sqlite",
      data: queries
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch queries",
      details: error.message
    });
  }
});

router.patch("/:id/resolve", async (req, res) => {
  try {
    const { answer } = req.body;

    if (!answer || answer.trim() === "") {
      return res.status(400).json({
        error: "Answer is required to resolve query"
      });
    }

    if (answer.length > 3000) {
      return res.status(400).json({
        error: "Answer must be 3000 characters or less"
      });
    }

    if (isMongoAvailable()) {
      const query = await UserQuery.findByIdAndUpdate(
        req.params.id,
        {
          answer: answer.trim(),
          status: "resolved",
          promoted: false
        },
        {
          new: true
        }
      );

      if (!query) {
        return res.status(404).json({
          error: "Query not found"
        });
      }

      await runSyncPipeline();

      return res.json({
        storage: "mongodb",
        data: query
      });
    }

    const db = getSQLiteDb();

    const result = await db.run(
      `
      UPDATE user_queries
      SET answer = ?,
          status = 'resolved',
          promoted = 0,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      answer.trim(),
      req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({
        error: "Query not found"
      });
    }

    await runSyncPipeline();

    const updated = await db.get(
      `
      SELECT *
      FROM user_queries
      WHERE id = ?
      `,
      req.params.id
    );

    return res.json({
      storage: "sqlite",
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to resolve query",
      details: error.message
    });
  }
});

module.exports = router;
