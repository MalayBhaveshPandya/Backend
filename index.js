const express = require("express");
const cors = require("cors");
const connectToMongo = require("./db");

const app = express();

const allowedOrigins = [
  "https://frontend-92cs.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(async (req, res, next) => {
  try {
    await connectToMongo();
    next();
  } catch (err) {
    console.error("❌ DB connection error:", err.stack || err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

app.use("/api/admin", require("./routes/admin/admin"));
app.use("/api/student", require("./routes/student/student"));
app.use("/api/clubs", require("./routes/clubs/club"));
app.use("/api/chat", require("./routes/chatbot/chatbot"));

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err);
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = app;

