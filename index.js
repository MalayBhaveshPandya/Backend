const connectToMongo = require("./db");
const express = require("express");
require("dotenv").config();
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let isConnected = false;
app.use(async (req, res, next) => {
  if (!isConnected) {
    try {
      await connectToMongo();
      isConnected = true;
      console.log("MongoDB connected");
    } catch (err) {
      console.error("MongoDB connection failed:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }
  }
  next();
});

app.get("/", (req, res) => {
  res.send("I am root");
});
app.use("/api/admin", require("./routes/admin/admin"));
app.use("/api/student", require("./routes/student/student"));
app.use("/api/clubs", require("./routes/clubs/club"));
app.use("/api/chat", require("./routes/chatbot/chatbot"));

module.exports = app;
