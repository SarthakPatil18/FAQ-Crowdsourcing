const express = require("express");
const router = express.Router();

const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const FAQ = require("../models/FAQ");
const UserQuery = require("../models/UserQuery");
const { trackEvent } = require("../services/eventService");
const { z } = require("zod");
const { validate } = require("../middleware/validate");

const searchSchema = z.object({
  body: z.object({
    keyword: z.string().max(200).optional(),
    keywords: z.array(z.string().max(80)).optional(),
    category: z.string().max(100).optional(),
    limit: z.number().min(1).max(50).optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

router.post("/", validate(searchSchema), async (req, res) => {
  try {
    const { keyword, keywords, category, limit = 20 } = req.body;

    let searchTerms = [];

    if (Array.isArray(keywords)) {
      searchTerms = keywords;
    } else if (keyword) {
      searchTerms = keyword.split(/\s+/);
    }

    searchTerms = searchTerms
      .map((term) => String(term).trim().toLowerCase())
      .filter(Boolean);

    if (searchTerms.length === 0) {
      return res.status(400).json({
        error: "At least one search keyword is required"
      });
    }

    const searchText = searchTerms.join(" ");

    const normalizedLimit = Math.min(Number(limit) || 20, 50);

    await trackEvent({
      type: "search_performed",
      userId: "anonymous",
      targetType: "search",
      targetId: searchText,
      metadata: {
        terms: searchTerms
      }
    });

    if (isMongoAvailable()) {
      const faqFilter = {
        $text: {
          $search: searchText
        }
      };

      if (category && category !== "All Categories") {
        faqFilter.category = category;
      }

      const queryFilter = {
        $text: {
          $search: searchText
        }
      };

      if (category && category !== "All Categories") {
        queryFilter.category = category;
      }

      const faqResults = await FAQ.find(
        faqFilter,
        {
          score: {
            $meta: "textScore"
          }
        }
      )
        .sort({
          score: {
            $meta: "textScore"
          },
          searchBoost: -1
        })
        .limit(normalizedLimit);

      const queryResults = await UserQuery.find(
        queryFilter,
        {
          score: {
            $meta: "textScore"
          }
        }
      )
        .sort({
          score: {
            $meta: "textScore"
          }
        })
        .limit(normalizedLimit);

      return res.json({
        storage: "mongodb",
        keyword: searchText,
        results: {
          faqs: faqResults,
          userQueries: queryResults
        }
      });
    }

    const db = getSQLiteDb();

    const likePattern = `%${searchText}%`;

    const categoryFilter =
      category && category !== "All Categories" ? category : null;

    const faqResults = await db.all(
      `
      SELECT *
      FROM faqs
      WHERE (
          LOWER(question) LIKE LOWER(?)
          OR LOWER(answer) LIKE LOWER(?)
          OR LOWER(keywords) LIKE LOWER(?)
          OR LOWER(tags) LIKE LOWER(?)
          OR LOWER(category) LIKE LOWER(?)
        )
        AND (? IS NULL OR category = ?)
      ORDER BY search_boost DESC, updated_at DESC
      LIMIT ?
      `,
      likePattern,
      likePattern,
      likePattern,
      likePattern,
      likePattern,
      categoryFilter,
      categoryFilter,
      normalizedLimit
    );

    const queryResults = await db.all(
      `
      SELECT *
      FROM user_queries
      WHERE (
          LOWER(question) LIKE LOWER(?)
          OR LOWER(answer) LIKE LOWER(?)
          OR LOWER(description) LIKE LOWER(?)
          OR LOWER(tags) LIKE LOWER(?)
          OR LOWER(category) LIKE LOWER(?)
        )
        AND (? IS NULL OR category = ?)
      ORDER BY updated_at DESC
      LIMIT ?
      `,
      likePattern,
      likePattern,
      likePattern,
      likePattern,
      likePattern,
      categoryFilter,
      categoryFilter,
      normalizedLimit
    );

    return res.json({
      storage: "sqlite",
      keyword: searchText,
      results: {
        faqs: faqResults,
        userQueries: queryResults
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Search failed",
      details: error.message
    });
  }
});

module.exports = router;
