const express = require("express");
const router = express.Router();
const cors = require("cors");
const fileUpload = require("../../middleware/cloudConfig");
const authClub = require("../../middleware/clubauth.js");
const authApprovedClub = require("../../middleware/clubApproved.js");
const { body } = require("express-validator");
const clubController = require("../../controllers/club_controller");

// Restrictive CORS for public endpoints with credentials support
const allowedOrigins = [
  "https://frontend-92cs.vercel.app",
  "http://localhost:5173",
];
const routeCors = cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, origin);
    console.warn("Blocked CORS request on /api/clubs/* from:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

router.post("/clublogin", [
  body("email", "Enter a valid email").isEmail(),
  body("password", "Password cannot be blank").exists(),
], clubController.clubLogin);
//Registering for Club and getting the club details and verifying it
router.post("/createclubs", fileUpload, clubController.createClub);
router.get("/getclub", authClub, clubController.getClub);
router.post("/verifyotp", clubController.verifyOTP);

//Event Creation,getting clubs events and all events
router.post("/addevents", authApprovedClub, fileUpload, clubController.addEvent);
// Ensure explicit CORS headers for the public events endpoint
router.options("/getevents", routeCors);
router.get("/getevents", routeCors, clubController.getAllEvents);
router.get("/events/:eventId/registrations", authApprovedClub, clubController.getEventRegistrations);
router.get("/events", authApprovedClub, clubController.getClubEvents);

module.exports = router;