const express = require("express");
const router = express.Router();

const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const FAQ = require("../models/FAQ");
const { extractKeywords } = require("../services/syncService");
const { inferCategory, normalizeTags } = require("../services/categoryService");
const { getCache, setCache, clearCache } = require("../services/cacheService");

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
    const { question, answer, category, tags } = req.body;

    const inferredCategory = category || inferCategory(`${question || ""} ${answer || ""}`);
    const normalizedTags = normalizeTags(tags || []);

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
        keywords,
        category: inferredCategory,
        tags: normalizedTags
      });

      clearCache("categories");

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
        category,
        tags,
        synced_to_mongo
      )
      VALUES (?, ?, ?, ?, ?, 0)
      `,
      question.trim(),
      answer.trim(),
      keywords.join(","),
      inferredCategory,
      normalizedTags.join(",")
    );

    clearCache("categories");

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

router.get("/meta/categories", async (req, res) => {
  try {
    const cached = getCache("categories");

    if (cached) {
      return res.json(cached);
    }

    if (isMongoAvailable()) {
      const categories = await FAQ.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 }
          }
        },
        {
          $sort: {
            count: -1
          }
        }
      ]);

      const payload = {
        status: "success",
        storage: "mongodb",
        data: categories.map((item) => ({
          name: item._id || "General",
          questions: item.count
        }))
      };

      setCache("categories", payload, 60000);

      return res.json(payload);
    }

    const db = getSQLiteDb();

    const rows = await db.all(`
      SELECT category AS name, COUNT(*) AS questions
      FROM faqs
      GROUP BY category
      ORDER BY questions DESC
    `);

    const payload = {
      status: "success",
      storage: "sqlite",
      data: rows
    };

    setCache("categories", payload, 60000);

    return res.json(payload);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch categories",
      details: error.message
    });
  }
});

module.exports = router;
