const Club = require("../models/club/club");
const Event = require("../models/club/event");
const EventRegistration = require("../models/club/eventRegistration");
const Student = require("../models/student/student");
const OtpVerification = require("../models/student/otpv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const connectToMongo = require("../../db");
const { 
  sendOTP1, 
  sendAdminClubAlert, 
  sendEventNotificationEmail 
} = require("../utils/emailService.js");

const JWT_SECRET = process.env.JWT_SECRET;

// ----------------------
// Create a new club
// ----------------------
const createClub = async (req, res) => {
  try {
    await connectToMongo();

    let club = await Club.findOne({ name: req.body.name });
    if (club) {
      return res.status(400).json({ error: "Club with this name already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(req.body.password, salt);

    const logoUrl = req.file ? req.file.path : "https://example.com/default-logo.png";

    club = await Club.create({
      name: req.body.name,
      description: req.body.description,
      logo: logoUrl,
      membersCount: req.body.membersCount,
      password: hashedPass,
      email: req.body.email
    });

    // Sending OTP and notify admin
    await sendOTP1(club.name, club.email);
    await sendAdminClubAlert(club.name, club.email);

    const data = { club: { _id: club._id } };
    const authToken = jwt.sign(data, JWT_SECRET);

    res.json({ success: true, authToken, club });
  } catch (error) {
    console.error("❌ createClub error:", error.stack || error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ----------------------
// Club login
// ----------------------
const clubLogin = async (req, res) => {
  try {
    await connectToMongo();

    const { email, password } = req.body;
    const club = await Club.findOne({ email });

    if (!club) {
      return res.status(400).json({ success: false, error: "Invalid credentials" });
    }

    const passMatch = await bcrypt.compare(password, club.password);
    if (!passMatch) {
      return res.status(400).json({ success: false, error: "Invalid credentials" });
    }

    const data = { club: { _id: club._id } };
    const authToken = jwt.sign(data, JWT_SECRET);

    res.json({ success: true, authToken });
  } catch (error) {
    console.error("❌ clubLogin error:", error.stack || error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ----------------------
// Get logged-in club details
// ----------------------
const getClub = async (req, res) => {
  try {
    await connectToMongo();

    const club = await Club.findById(req.club._id).select("-password");
    res.json(club);
  } catch (error) {
    console.error("❌ getClub error:", error.stack || error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ----------------------
// Verify OTP
// ----------------------
const verifyOTP = async (req, res) => {
  try {
    await connectToMongo();

    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Missing email or OTP" });

    const club = await Club.findOne({ email });
    if (!club) return res.status(400).json({ message: "Club not found" });

    const otpRecord = await OtpVerification.findOne({ userId: club._id });
    if (!otpRecord) return res.status(400).json({ message: "OTP record not found or already verified" });

    const isMatch = await bcrypt.compare(otp, otpRecord.otp);
    if (!isMatch) return res.status(400).json({ message: "Invalid OTP" });

    await Club.updateOne({ _id: club._id }, { isVerified: true });
    await OtpVerification.deleteMany({ userId: club._id });

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("❌ verifyOTP error:", error.stack || error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ----------------------
// Add new event (approved clubs only)
// ----------------------
const addEvent = async (req, res) => {
  try {
    await connectToMongo();

    const posterUrl = req.files?.poster
      ? req.files.poster[0].path
      : "https://example.com/default-poster.png";

    const newEvent = await Event.create({
      organizer: req.club._id,
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      location: req.body.location,
      poster: posterUrl,
      registrationForm: JSON.parse(req.body.registrationForm || "[]"),
    });

    // Notify verified students asynchronously
    setImmediate(async () => {
      try {
        const students = await Student.find({ isVerified: true });
        for (const student of students) {
          await sendEventNotificationEmail(student.email, student.name, newEvent);
        }
        console.log(`✅ Notifications sent to ${students.length} students`);
      } catch (err) {
        console.error("❌ Error sending notifications:", err);
      }
    });

    res.status(201).json({ message: "Event created successfully", event: newEvent });
  } catch (error) {
    console.error("❌ addEvent error:", error.stack || error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ----------------------
// Get all events (public)
// ----------------------
const getAllEvents = async (req, res) => {
  try {
    await connectToMongo();

    const events = await Event.find()
      .sort({ date: -1 })
      .limit(100) // prevent serverless timeout
      .populate({
        path: "organizer",
        select: "name email membersCount logo isVerified",
        strictPopulate: false,
        match: { isVerified: true }, // optional
      })
      .lean();

    console.log(`✅ Fetched ${events.length} events`);
    res.json(events);
  } catch (error) {
    console.error("❌ getAllEvents error:", error.stack || error);
    res.status(500).json({ message: "Failed to fetch events", error: error.message });
  }
};

// ----------------------
// Get events for logged-in club
// ----------------------
const getClubEvents = async (req, res) => {
  try {
    await connectToMongo();

    const events = await Event.find({ organizer: req.club._id })
      .sort({ date: -1 })
      .populate({
        path: "organizer",
        select: "name email logo membersCount isVerified",
        strictPopulate: false,
      })
      .lean();

    res.json(events);
  } catch (error) {
    console.error("❌ getClubEvents error:", error.stack || error);
    res.status(500).json({ message: "Failed to fetch club events" });
  }
};

// ----------------------
// Get registrations for a specific event (private)
// ----------------------
const getEventRegistrations = async (req, res) => {
  try {
    await connectToMongo();

    const eventId = req.params.eventId;
    const event = await Event.findById(eventId).lean();

    if (!event) return res.status(404).json({ message: "Event not found" });
    if (String(event.organizer) !== String(req.club._id)) return res.status(403).json({ message: "Not authorized" });

    const registrations = await EventRegistration.find({ event: eventId })
      .populate("registrant", "name email rollno")
      .sort({ registeredAt: -1 })
      .lean();

    res.json(registrations);
  } catch (error) {
    console.error("❌ getEventRegistrations error:", error.stack || error);
    res.status(500).json({ message: "Failed to fetch registrations" });
  }
};

module.exports = {
  createClub,
  clubLogin,
  getClub,
  verifyOTP,
  addEvent,
  getAllEvents,
  getClubEvents,
  getEventRegistrations,
};
