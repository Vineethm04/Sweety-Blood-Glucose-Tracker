const prisma = require("../config/prisma");

const validSlots = [
  "MORNING",
  "AFTER_BREAKFAST",
  "AFTER_LUNCH",
  "AFTER_DINNER"
];

const slotNames = {
  MORNING: "Morning",
  AFTER_BREAKFAST: "After breakfast",
  AFTER_LUNCH: "After lunch",
  AFTER_DINNER: "After dinner"
};

// Validate reading date
const validateReadingDate = (readingDate) => {
  if (
    typeof readingDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(readingDate)
  ) {
    return null;
  }

  const date = new Date(`${readingDate}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== readingDate
  ) {
    return null;
  }

  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  if (readingDate > todayString) {
    return "FUTURE_DATE";
  }

  return date;
};

// Validate glucose value
const validateGlucoseValue = (glucoseValue) => {
  if (
    glucoseValue === undefined ||
    glucoseValue === null ||
    glucoseValue === ""
  ) {
    return {
      valid: false,
      message: "Please enter a glucose value."
    };
  }

  const value = Number(glucoseValue);

  if (!Number.isInteger(value) || value < 40 || value > 600) {
    return {
      valid: false,
      message: "Value must be between 40 and 600 mg/dl."
    };
  }

  return {
    valid: true,
    value
  };
};

// Create a new glucose reading
const createReading = async (req, res) => {
  try {
    const { readingDate, slot, glucoseValue } = req.body;
    const userId = req.user.userId;

    const glucoseValidation = validateGlucoseValue(glucoseValue);

    if (!glucoseValidation.valid) {
      return res.status(400).json({
        success: false,
        message: glucoseValidation.message
      });
    }

    if (!readingDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide a reading date."
      });
    }

    if (!slot) {
      return res.status(400).json({
        success: false,
        message: "Please select a time slot."
      });
    }

    if (!validSlots.includes(slot)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid time slot."
      });
    }

    const date = validateReadingDate(readingDate);

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid reading date."
      });
    }

    if (date === "FUTURE_DATE") {
      return res.status(400).json({
        success: false,
        message: "Date cannot be in the future."
      });
    }

    const existingReading = await prisma.reading.findUnique({
      where: {
        userId_readingDate_slot: {
          userId,
          readingDate: date,
          slot
        }
      }
    });

    if (existingReading) {
      const article = slot === "MORNING" ? "a" : "an";

      return res.status(409).json({
        success: false,
        message: `You already have ${article} ${slotNames[slot]} reading for this date.`
      });
    }

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
        glucoseValue: glucoseValidation.value
      }
    });

    return res.status(201).json({
      success: true,
      message: "Glucose reading added successfully.",
      reading
    });
  } catch (error) {
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

// Get all readings belonging to the logged-in user
const getReadings = async (req, res) => {
  try {
    const userId = req.user.userId;

    const readings = await prisma.reading.findMany({
      where: { userId },
      orderBy: [
        { readingDate: "desc" },
        { createdAt: "desc" }
      ]
    });

    return res.status(200).json({
      success: true,
      count: readings.length,
      readings
    });
  } catch (error) {
    console.error("Get readings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve glucose readings."
    });
  }
};

// Get a single reading belonging to the logged-in user
const getReadingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const reading = await prisma.reading.findFirst({
      where: { id, userId }
    });

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: "Glucose reading not found."
      });
    }

    return res.status(200).json({
      success: true,
      reading
    });
  } catch (error) {
    console.error("Get reading error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve glucose reading."
    });
  }
};

// Update an existing glucose reading
const updateReading = async (req, res) => {
  try {
    const { id } = req.params;
    const { readingDate, slot, glucoseValue } = req.body;
    const userId = req.user.userId;

    const existingReading = await prisma.reading.findFirst({
      where: { id, userId }
    });

    if (!existingReading) {
      return res.status(404).json({
        success: false,
        message: "Glucose reading not found."
      });
    }

    const newValue =
      glucoseValue === undefined
        ? existingReading.glucoseValue
        : glucoseValue;

    const glucoseValidation = validateGlucoseValue(newValue);

    if (!glucoseValidation.valid) {
      return res.status(400).json({
        success: false,
        message: glucoseValidation.message
      });
    }

    const newDateInput =
      readingDate === undefined
        ? existingReading.readingDate.toISOString().slice(0, 10)
        : readingDate;

    const newSlot =
      slot === undefined ? existingReading.slot : slot;

    if (!validSlots.includes(newSlot)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid time slot."
      });
    }

    const newDate = validateReadingDate(newDateInput);

    if (!newDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid reading date."
      });
    }

    if (newDate === "FUTURE_DATE") {
      return res.status(400).json({
        success: false,
        message: "Date cannot be in the future."
      });
    }

    const duplicateReading = await prisma.reading.findFirst({
      where: {
        userId,
        readingDate: newDate,
        slot: newSlot,
        NOT: { id }
      }
    });

    if (duplicateReading) {
      const article = newSlot === "MORNING" ? "a" : "an";

      return res.status(409).json({
        success: false,
        message: `You already have ${article} ${slotNames[newSlot]} reading for this date.`
      });
    }

    if (
      newDate.getTime() !== existingReading.readingDate.getTime()
    ) {
      const dailyCount = await prisma.reading.count({
        where: {
          userId,
          readingDate: newDate
        }
      });

      if (dailyCount >= 4) {
        return res.status(409).json({
          success: false,
          message: "You can add only 4 readings per day."
        });
      }
    }

    const updatedReading = await prisma.reading.update({
      where: { id },
      data: {
        readingDate: newDate,
        slot: newSlot,
        glucoseValue: glucoseValidation.value
      }
    });

    return res.status(200).json({
      success: true,
      message: "Glucose reading updated successfully.",
      reading: updatedReading
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A reading already exists for this time slot and date."
      });
    }

    console.error("Update reading error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update glucose reading."
    });
  }
};

// Delete a glucose reading belonging to the logged-in user
const deleteReading = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const existingReading = await prisma.reading.findFirst({
      where: { id, userId }
    });

    if (!existingReading) {
      return res.status(404).json({
        success: false,
        message: "Glucose reading not found."
      });
    }

    await prisma.reading.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: "Glucose reading deleted successfully."
    });
  } catch (error) {
    console.error("Delete reading error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete glucose reading."
    });
  }
};

module.exports = {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading
};
