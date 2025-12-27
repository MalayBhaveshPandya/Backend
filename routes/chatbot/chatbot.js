const express = require("express");
const router = express.Router();
const axios = require("axios");
const chatbotController = require("../../controllers/chatbot_controller");


router.post("/chat", chatbotController.chatBot);

module.exports = router;
