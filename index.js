const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectToMongo = require("./db");

const app = express();

const corsOptions = {
  origin: "https://frontend-92cs.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectToMongo()
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });
  
app.get("/", (req, res) => {
  res.send("I am root");
});

app.use("/api/admin", require("./routes/admin/admin"));
app.use("/api/student", require("./routes/student/student"));
app.use("/api/clubs", require("./routes/clubs/club"));
app.use("/api/chat", require("./routes/chatbot/chatbot"));
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = app;
