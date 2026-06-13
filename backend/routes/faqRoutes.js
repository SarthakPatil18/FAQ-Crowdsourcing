const express = require("express");
const router = express.Router();

const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const FAQ = require("../models/FAQ");
const { extractKeywords } = require("../services/syncService");

router.get("/", async (req, res) => {
  try {
    if (isMongoAvailable()) {
      const faqs = await FAQ.find().sort({ createdAt: -1 });

      return res.json({
        storage: "mongodb",
        data: faqs
      });
    }

    const db = getSQLiteDb();

    const faqs = await db.all(`
      SELECT *
      FROM faqs
      ORDER BY created_at DESC
    `);

    return res.json({
      storage: "sqlite",
      data: faqs
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch FAQs",
      details: error.message
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || question.trim() === "" || !answer || answer.trim() === "") {
      return res.status(400).json({
        error: "Question and answer are required"
      });
    }

    if (question.length > 500) {
      return res.status(400).json({
        error: "Question must be 500 characters or less"
      });
    }

    if (answer.length > 3000) {
      return res.status(400).json({
        error: "Answer must be 3000 characters or less"
      });
    }

    const keywords = extractKeywords(`${question} ${answer}`);

    if (isMongoAvailable()) {
      const faq = await FAQ.create({
        question: question.trim(),
        answer: answer.trim(),
        keywords
      });

      return res.status(201).json({
        storage: "mongodb",
        data: faq
      });
    }

    const db = getSQLiteDb();

    const result = await db.run(
      `
      INSERT INTO faqs (
        question,
        answer,
        keywords,
        synced_to_mongo
      )
      VALUES (?, ?, ?, 0)
      `,
      question.trim(),
      answer.trim(),
      keywords.join(",")
    );

    return res.status(201).json({
      storage: "sqlite",
      data: {
        id: result.lastID,
        question: question.trim(),
        answer: answer.trim(),
        keywords
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to create FAQ",
      details: error.message
    });
  }
});

module.exports = router;
