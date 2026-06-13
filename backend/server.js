require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { GoogleGenAI } = require("@google/genai");

const { connectMongo, isMongoAvailable } = require("./db/mongo");
const { connectSQLite } = require("./db/sqlite");
const { startSyncPipeline, runSyncPipeline } = require("./services/syncService");

const faqRoutes = require("./routes/faqRoutes");
const queryRoutes = require("./routes/queryRoutes");
const searchRoutes = require("./routes/searchRoutes");
const followRoutes = require("./routes/followRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
console.log("Gemini key found:", !!process.env.GEMINI_API_KEY);
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Crowdsourced FAQ backend is running",
    stack: "MERN",
    primaryStore: "MongoDB",
    fallbackStore: "SQLite",
    mongoAvailable: isMongoAvailable(),
    endpoints: {
      health: "GET /health",
      faqs: "GET /api/faqs",
      createFaq: "POST /api/faqs",
      queries: "GET /api/queries",
      submitQuery: "POST /api/queries",
      resolveQuery: "PATCH /api/queries/:id/resolve",
      search: "POST /api/search"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mongoAvailable: isMongoAvailable(),
    fallback: "sqlite"
  });
});


app.post("/api/summary", async (req, res) => {
  try {
    const { question, answers } = req.body;

    const prompt = `
Summarize this FAQ discussion.

Question:
${question}

Answers:
${answers.join("\n")}

Return:
- 3 bullet points
- Maximum 100 words
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({
      summary: response.text,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to generate summary",
    });
  }
});

app.use("/api/faqs", faqRoutes);
app.use("/api/queries", queryRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/notifications", notificationRoutes);

async function bootstrap() {
  await connectSQLite();
  await connectMongo();

  await runSyncPipeline();
  startSyncPipeline();

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

bootstrap();