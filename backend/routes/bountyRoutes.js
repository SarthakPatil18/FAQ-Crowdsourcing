const express = require("express");
const router = express.Router();
const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const Bounty = require("../models/Bounty");
const Answer = require("../models/Answer");
const UserQuery = require("../models/UserQuery");
const { requireAuth } = require("../middleware/auth");
const { success, fail } = require("../utils/apiResponse");
const { adjustUserStats } = require("../services/badgeService");

// POST /api/bounties - Create a bounty on a query
router.post("/", requireAuth, async (req, res) => {
  try {
    const { queryId, amount, durationDays } = req.body;
    if (!queryId || !amount || amount <= 0) {
      return fail(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "queryId and positive amount are required"
      });
    }

    const duration = durationDays || 7;
    const expiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
    const creatorId = req.user.id;

    // Verify creator has enough reputation
    // If Mongo is down, check SQLite user
    let userRep = 0;
    const db = getSQLiteDb();

    if (isMongoAvailable()) {
      const User = require("../models/User");
      const user = await User.findById(creatorId);
      userRep = user ? user.reputation : 0;
    } else {
      const user = await db.get("SELECT reputation FROM users WHERE id = ? OR mongo_id = ?", creatorId, creatorId);
      userRep = user ? user.reputation : 0;
    }

    if (userRep < amount) {
      return fail(res, {
        statusCode: 400,
        code: "INSUFFICIENT_REPUTATION",
        message: `You need at least ${amount} reputation to create this bounty. Your current reputation is ${userRep}.`
      });
    }

    let savedBounty = null;

    const mongoose = require("mongoose");
    if (isMongoAvailable() && mongoose.Types.ObjectId.isValid(queryId)) {
      const bounty = new Bounty({
        queryId,
        amount,
        createdBy: creatorId,
        expiresAt,
        status: "open"
      });
      savedBounty = await bounty.save();
    }

    // Deduct creator reputation
    await adjustUserStats(creatorId, { reputationDelta: -amount });

    const mongoIdStr = savedBounty ? String(savedBounty._id) : null;
    const result = await db.run(
      `
      INSERT INTO bounties (mongo_id, query_id, amount, created_by, status, expires_at)
      VALUES (?, ?, ?, ?, 'open', ?)
      `,
      mongoIdStr,
      String(queryId),
      amount,
      creatorId,
      expiresAt.toISOString()
    );

    return success(res, {
      statusCode: 201,
      data: {
        id: mongoIdStr || String(result.lastID),
        queryId,
        amount,
        createdBy: creatorId,
        expiresAt,
        status: "open"
      }
    });
  } catch (error) {
    console.error("Bounty Create Error:", error);
    return fail(res, {
      statusCode: 500,
      code: "BOUNTY_CREATE_FAILED",
      message: "Failed to create bounty",
      details: error.message
    });
  }
});

// POST /api/bounties/:id/award - Award bounty to an answer
router.post("/:id/award", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { answerId } = req.body;

    if (!answerId) {
      return fail(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "answerId is required to award the bounty"
      });
    }

    const db = getSQLiteDb();
    let bounty = null;

    const mongoose = require("mongoose");
    if (isMongoAvailable() && mongoose.Types.ObjectId.isValid(id)) {
      bounty = await Bounty.findById(id);
    }
    
    // If not found in Mongo (or not a Mongo ID), fallback to SQLite
    if (!bounty) {
      bounty = await db.get("SELECT * FROM bounties WHERE id = ? OR mongo_id = ?", id, id);
    }

    if (!bounty) {
      return fail(res, {
        statusCode: 404,
        code: "BOUNTY_NOT_FOUND",
        message: "Bounty not found"
      });
    }

    const status = bounty.status;
    if (status !== "open") {
      return fail(res, {
        statusCode: 400,
        code: "BOUNTY_ALREADY_CLOSED",
        message: "Bounty is not open"
      });
    }

    const createdBy = String(bounty.createdBy || bounty.created_by);
    if (createdBy !== String(req.user.id) && req.user.role !== "admin") {
      return fail(res, {
        statusCode: 403,
        code: "FORBIDDEN",
        message: "Only the bounty creator or an admin can award this bounty"
      });
    }

    // Verify answer author to award reputation
    let answerAuthorId = null;
    let answerQueryId = null;
    let mongoAnswer = null;

    if (isMongoAvailable() && mongoose.Types.ObjectId.isValid(answerId)) {
      mongoAnswer = await Answer.findById(answerId);
    }

    if (mongoAnswer) {
      answerAuthorId = mongoAnswer.userId;
      answerQueryId = String(mongoAnswer.queryId);
    } else {
      const answer = await db.get("SELECT user_id, query_id FROM answers WHERE id = ? OR mongo_id = ?", answerId, answerId);
      answerAuthorId = answer ? answer.user_id : null;
      answerQueryId = answer ? String(answer.query_id) : null;
    }

    if (!answerAuthorId) {
      return fail(res, {
        statusCode: 404,
        code: "ANSWER_NOT_FOUND",
        message: "Referenced answer not found"
      });
    }

    const bountyQueryId = String(bounty.queryId || bounty.query_id);
    if (answerQueryId !== bountyQueryId) {
      return fail(res, {
        statusCode: 400,
        code: "INVALID_ANSWER",
        message: "Answer does not belong to the question associated with this bounty"
      });
    }

    const bountyAmount = bounty.amount;

    if (isMongoAvailable() && bounty && bounty.save) {
      bounty.status = "closed";
      bounty.winnerId = answerAuthorId;
      if (mongoose.Types.ObjectId.isValid(answerId)) {
        bounty.winnerAnswerId = answerId;
      }
      await bounty.save();
    }

    // Award answer author reputation
    await adjustUserStats(answerAuthorId, { reputationDelta: bountyAmount });

    // SQLite update
    await db.run(
      `
      UPDATE bounties
      SET status = 'closed', winner_id = ?, winner_answer_id = ?
      WHERE id = ? OR mongo_id = ?
      `,
      answerAuthorId,
      String(answerId),
      id,
      id
    );

    return success(res, {
      message: `Bounty of ${bountyAmount} reputation awarded to user ${answerAuthorId}`
    });
  } catch (error) {
    return fail(res, {
      statusCode: 500,
      code: "BOUNTY_AWARD_FAILED",
      message: "Failed to award bounty",
      details: error.message
    });
  }
});

// GET /api/bounties - List open bounties
router.get("/", async (req, res) => {
  try {
    let mongoBounties = [];
    if (isMongoAvailable()) {
      mongoBounties = await Bounty.find({ status: "open" }).sort({ createdAt: -1 });
    }

    const db = getSQLiteDb();
    const sqliteBounties = await db.all("SELECT * FROM bounties WHERE status = 'open' ORDER BY created_at DESC");

    const formattedSqliteBounties = sqliteBounties.map(b => ({
      id: b.mongo_id || String(b.id),
      queryId: b.query_id,
      amount: b.amount,
      createdBy: b.created_by,
      status: b.status,
      expiresAt: b.expires_at,
      createdAt: b.created_at
    }));

    if (isMongoAvailable()) {
      // Merge: only include SQLite bounties that don't have a mongo_id (i.e. strictly local)
      const localOnlyBounties = formattedSqliteBounties.filter(b => !b.id.match(/^[0-9a-fA-F]{24}$/));
      return success(res, {
        storage: "mongodb+sqlite",
        data: [...mongoBounties, ...localOnlyBounties]
      });
    }

    return success(res, {
      storage: "sqlite",
      data: formattedSqliteBounties
    });
  } catch (error) {
    return fail(res, {
      statusCode: 500,
      code: "BOUNTIES_FETCH_FAILED",
      message: "Failed to fetch open bounties",
      details: error.message
    });
  }
});

module.exports = router;
