const { getSQLiteDb } = require("../db/sqlite");

async function dispatchNotification(eventConfig) {
  const { eventType, triggeredByUserId, followableType, followableId, message } = eventConfig;
  const db = getSQLiteDb();
  
  if (!triggeredByUserId) return; // Need a user to trigger

  try {
    // Find all users who follow this entity and are not muted
    // Self-notifications are allowed for testing purposes
    const followers = await db.all(`
      SELECT user_id, id as follow_id 
      FROM follows 
      WHERE followable_type = ? 
        AND followable_id = ? 
        AND is_muted = 0
    `, followableType, followableId);

    for (const follower of followers) {
      await db.run(`
        INSERT INTO notifications (user_id, follow_id, message) 
        VALUES (?, ?, ?)
      `, follower.user_id, follower.follow_id, message);
    }
  } catch (error) {
    console.error("Failed to dispatch notifications:", error);
  }
}

module.exports = { dispatchNotification };
