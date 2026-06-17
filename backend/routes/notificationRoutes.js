const express = require("express");
const router = express.Router();
const { getSQLiteDb } = require("../db/sqlite");

router.get("/", async (req, res) => {
  try {
    const user_id = req.query.user_id || req.headers['user-id'];

    if (!user_id) {
      return res.status(401).json({ error: "User ID is required" });
    }

    const db = getSQLiteDb();
    const user = await db.get("SELECT id, mongo_id FROM users WHERE id = ? OR mongo_id = ?", user_id, user_id);
    const userIdMatch = user ? [String(user.id), user.mongo_id].filter(Boolean) : [user_id];

    const placeholders = userIdMatch.map(() => "?").join(",");
    const notifications = await db.all(`
      SELECT * FROM notifications 
      WHERE user_id IN (${placeholders}) 
      ORDER BY created_at DESC
    `, ...userIdMatch);
    
    const formatted = notifications.map(n => ({
      ...n,
      is_read: !!n.is_read
    }));

    res.json({ data: formatted });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications", details: error.message });
  }
});

router.patch("/read", async (req, res) => {
  try {
    const user_id = req.body.user_id || req.headers['user-id'];

    if (!user_id) {
      return res.status(401).json({ error: "User ID is required" });
    }

    const db = getSQLiteDb();
    const user = await db.get("SELECT id, mongo_id FROM users WHERE id = ? OR mongo_id = ?", user_id, user_id);
    const userIdMatch = user ? [String(user.id), user.mongo_id].filter(Boolean) : [user_id];

    const placeholders = userIdMatch.map(() => "?").join(",");
    await db.run(
      `UPDATE notifications SET is_read = 1 WHERE user_id IN (${placeholders})`, 
      ...userIdMatch
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notifications as read", details: error.message });
  }
});

module.exports = router;
