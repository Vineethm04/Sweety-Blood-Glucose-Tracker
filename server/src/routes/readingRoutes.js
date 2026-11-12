const express = require("express");

const {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading
} = require("../controllers/readingController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Protect all reading routes
router.use(authMiddleware);

// Create a new glucose reading
router.post("/", createReading);

// Get all readings belonging to the logged-in user
router.get("/", getReadings);

// Get a single reading by ID
router.get("/:id", getReadingById);

// Update an existing glucose reading
router.put("/:id", updateReading);

// Delete a glucose reading
router.delete("/:id", deleteReading);

module.exports = router;
