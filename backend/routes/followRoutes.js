const express = require("express");
const router = express.Router();
const { getSQLiteDb } = require("../db/sqlite");

router.post("/", async (req, res) => {
  try {
    const { followable_type, followable_id } = req.body;
    const user_id = req.body.user_id || req.headers['user-id'];

    if (!user_id) {
      return res.status(401).json({ error: "User ID is required" });
    }

    if (!followable_type || !followable_id) {
      return res.status(400).json({ error: "followable_type and followable_id are required" });
    }

    if (!['question', 'tag'].includes(followable_type)) {
      return res.status(400).json({ error: "followable_type must be 'question' or 'tag'" });
    }

    const db = getSQLiteDb();
    
    // Check if already follows
    const existing = await db.get(
      `SELECT id FROM follows WHERE user_id = ? AND followable_type = ? AND followable_id = ?`,
      user_id, followable_type, followable_id
    );

    if (existing) {
      return res.status(409).json({ error: "Already following" });
    }

    const result = await db.run(
      `INSERT INTO follows (user_id, followable_type, followable_id) VALUES (?, ?, ?)`,
      user_id, followable_type, followable_id
    );

    res.status(201).json({ 
      id: result.lastID, 
      user_id, 
      followable_type, 
      followable_id, 
      is_muted: false 
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create follow", details: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const db = getSQLiteDb();
    const result = await db.run(`DELETE FROM follows WHERE id = ?`, req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "Follow record not found" });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to unfollow", details: error.message });
  }
});

router.patch("/:id/mute", async (req, res) => {
  try {
    const { is_muted } = req.body;
    const db = getSQLiteDb();
    
    const result = await db.run(
      `UPDATE follows SET is_muted = ? WHERE id = ?`, 
      is_muted ? 1 : 0, 
      req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Follow record not found" });
    }

    res.json({ success: true, id: req.params.id, is_muted: !!is_muted });
  } catch (error) {
    res.status(500).json({ error: "Failed to mute follow", details: error.message });
  }
});

module.exports = router;
