const prisma = require("../config/prisma");

// Create a new glucose reading
const createReading = async (req, res) => {
  try {
    const { readingDate, slot, glucoseValue } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!readingDate || !slot || glucoseValue === undefined || glucoseValue === null || glucoseValue === "") {
      return res.status(400).json({
        success: false,
        message: "Date, time slot and glucose value are required."
      });
    }

    // Validate glucose value
    const value = Number(glucoseValue);

    if (!Number.isInteger(value) || value < 40 || value > 600) {
      return res.status(400).json({
        success: false,
        message: "Value must be between 40 and 600 mg/dl."
      });
    }

    // Validate time slot
    const validSlots = [
      "MORNING",
      "AFTER_BREAKFAST",
      "AFTER_LUNCH",
      "AFTER_DINNER"
    ];

    if (!validSlots.includes(slot)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid time slot."
      });
    }

    // Validate date format
    if (
      typeof readingDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(readingDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid reading date."
      });
    }

    const date = new Date(`${readingDate}T00:00:00.000Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== readingDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid reading date."
      });
    }

    const today = new Date();
    const todayString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0")
    ].join("-");

    if (readingDate > todayString) {
      return res.status(400).json({
        success: false,
        message: "Date cannot be in the future."
      });
    }

    // Check whether this user already has a reading for this slot and date
    const existingReading = await prisma.reading.findUnique({
      where: {
        userId_readingDate_slot: {
          userId,
          readingDate: date,
          slot
        }
      }
    });

    const slotNames = {
      MORNING: "Morning",
      AFTER_BREAKFAST: "After breakfast",
      AFTER_LUNCH: "After lunch",
      AFTER_DINNER: "After dinner"
    };

    if (existingReading) {
      return res.status(409).json({
        success: false,
        message: `You already have an ${slotNames[slot]} reading for this date.`
      });
    }

    // Check daily reading limit
    const dailyCount = await prisma.reading.count({
      where: {
        userId,
        readingDate: date
      }
    });

    if (dailyCount >= 4) {
      return res.status(409).json({
        success: false,
        message: "You can add only 4 readings per day."
      });
    }

    const reading = await prisma.reading.create({
      data: {
        userId,
        readingDate: date,
        slot,
        glucoseValue: value
      }
    });

    return res.status(201).json({
      success: true,
      message: "Glucose reading added successfully.",
      reading
    });
  } catch (error) {
    // Handles duplicate readings even if simultaneous requests occur
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A reading already exists for this time slot and date."
      });
    }

    console.error("Create reading error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create glucose reading."
    });
  }
};

module.exports = {
  createReading
};
