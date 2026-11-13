const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const readingRoutes = require("./routes/readingRoutes");

const app = express();

if (
  !process.env.DATABASE_URL ||
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET === "replace_with_a_long_random_secret"
) {
  throw new Error(
    "Please configure DATABASE_URL and a secure JWT_SECRET in .env"
  );
}

app.use(
  cors({
    origin: "http://localhost:5173"
  })
);

app.use(express.json({ limit: "10kb" }));

// API health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Sweety API is running successfully!"
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/readings", readingRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found."
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Server error:", error);

  if (res.headersSent) {
    return next(error);
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body."
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error."
  });
});

// Start the server only when this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Sweety server running on port ${PORT}`);
  });
}

module.exports = app;
