const express = require("express");
const router = express.Router();

const { generateSummary } = require("../services/aiService");

router.post("/summary", async (req, res) => {
  try {
    const { question, answers } = req.body;

    const summary = await generateSummary(question, answers);

    res.json({
      summary,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to generate summary",
    });
  }
});

module.exports = router;