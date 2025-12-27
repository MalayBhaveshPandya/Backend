const express = require("express");
const cors = require("cors");
const connectToMongo = require("./db");

const app = express();

// ----------------------
// CORS CONFIGURATION
// ----------------------
const allowedOrigins = [
  "https://frontend-92cs.vercel.app",
  "https://www.frontend-92cs.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000"
];

const corsOptions = {
  origin: allowedOrigins,

  credentials: true, // required for cookies/auth
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200 // some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// Handle preflight OPTIONS requests explicitly
app.options("*", cors(corsOptions));

// ----------------------
// BODY PARSERS
// ----------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------
// MONGODB CONNECTION (CACHED)
// ----------------------
app.use(async (req, res, next) => {
  try {
    const start = Date.now();
    await connectToMongo();
    const ms = Date.now() - start;
    if (ms > 1000) {
      console.warn(`⚠️ Slow DB connect on request: ${ms}ms`);
    }
    next();
  } catch (err) {
    console.error("❌ DB connection error:", err.stack || err);
    res.status(500).json({ error: "Database connection failed", details: err.message });
  }
});

// ----------------------
// ROUTES
// ----------------------
app.use("/api/admin", require("./routes/admin/admin"));
app.use("/api/student", require("./routes/student/student"));
app.use("/api/clubs", require("./routes/clubs/club"));
app.use("/api/chat", require("./routes/chatbot/chatbot"));

// ----------------------
// GLOBAL ERROR HANDLER
// ----------------------
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err);
  res.status(500).json({ error: "Internal Server Error" });
});

// ----------------------
// HEALTH ENDPOINT
// ----------------------
app.get("/api/health", async (req, res) => {
  try {
    const start = Date.now();
    await connectToMongo();
    const ms = Date.now() - start;
    res.json({
      ok: true,
      dbConnectedMs: ms,
      origin: req.headers.origin || null,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = app;
