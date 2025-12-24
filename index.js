const connectToMongo = require("./db");
const express = require("express");
require("dotenv").config();
const cors = require("cors");

const app = express();
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://frontend-92cs-d24p11bf0-malay-bhavesh-pandyas-projects.vercel.app"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});


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
app.options("*", cors(corsOptions));

app.get("/", (req, res) => res.send("I am root"));

app.use("/api/admin", require("./routes/admin/admin"));
app.use("/api/student", require("./routes/student/student"));
app.use("/api/clubs", require("./routes/clubs/club"));
app.use("/api/chat", require("./routes/chatbot/chatbot"));

module.exports = app;

