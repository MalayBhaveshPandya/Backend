const express = require("express");
const cors = require("cors");
const connectToMongo = require("./db");

const app = express();

// ----------------------
// CORS CONFIGURATION
// ----------------------
const allowedOrigins = [
  "https://frontend-92cs.vercel.app",
  "http://localhost:5173", // optional for local dev
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow server-to-server requests (no origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("Blocked CORS request from:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // required for cookies/auth
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight OPTIONS requests
app.options("*", cors());

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
    await connectToMongo();
    next();
  } catch (err) {
    console.error("❌ DB connection error:", err.stack || err);
    res.status(500).json({ error: "Database connection failed" });
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

module.exports = app;
