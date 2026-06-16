const { getSQLiteDb } = require("../db/sqlite");

async function autoFollow(user_id, followable_type, followable_id) {
  if (!user_id || !followable_type || !followable_id) return;
  
  try {
    const db = getSQLiteDb();
    
    // Check if already follows to avoid unique constraint error spam
    const existing = await db.get(
      `SELECT id FROM follows WHERE user_id = ? AND followable_type = ? AND followable_id = ?`,
      user_id, followable_type, followable_id
    );

    if (!existing) {
      await db.run(
        `INSERT INTO follows (user_id, followable_type, followable_id) VALUES (?, ?, ?)`,
        user_id, followable_type, followable_id
      );
    }
  } catch (error) {
    console.error("Failed to auto-follow:", error.message);
  }
}

module.exports = {
  autoFollow
};
