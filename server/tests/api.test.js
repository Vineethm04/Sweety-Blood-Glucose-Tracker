const request = require("supertest");
const jwt = require("jsonwebtoken");

// Mock Prisma so tests never modify the actual database
jest.mock("../src/config/prisma", () => ({
  reading: {
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}));

const prisma = require("../src/config/prisma");
const app = require("../src/server");

const testUserId = "11111111-1111-4111-8111-111111111111";
const anotherUserId = "33333333-3333-4333-8333-333333333333";

const token = jwt.sign(
  { userId: testUserId },
  process.env.JWT_SECRET
);

describe("Sweety API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: API health check
  test("GET / should return a successful response", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Sweety API is running successfully!"
    );
  });

  // Test 2: Unknown routes
  test("Unknown routes should return 404", async () => {
    const response = await request(app).get("/unknown-route");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("API endpoint not found.");
  });

  // Test 3: Authentication protection
  test("GET /api/readings should reject requests without authentication", async () => {
    const response = await request(app).get("/api/readings");

    expect(response.status).toBe(401);
  });

  // Test 4: Empty glucose value
  test("Should reject an empty glucose value", async () => {
    const response = await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        readingDate: "2026-11-13",
        slot: "MORNING",
        glucoseValue: ""
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Please enter a glucose value."
    );
    expect(prisma.reading.create).not.toHaveBeenCalled();
  });

  // Test 5: Glucose value below minimum
  test("Should reject glucose values below 40", async () => {
    const response = await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        readingDate: "2026-11-13",
        slot: "MORNING",
        glucoseValue: 30
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Value must be between 40 and 600 mg/dl."
    );
  });

  // Test 6: Glucose value above maximum
  test("Should reject glucose values above 600", async () => {
    const response = await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        readingDate: "2026-11-13",
        slot: "MORNING",
        glucoseValue: 650
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Value must be between 40 and 600 mg/dl."
    );
  });

  // Test 7: Decimal glucose value
  test("Should reject decimal glucose values", async () => {
    const response = await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        readingDate: "2026-11-13",
        slot: "MORNING",
        glucoseValue: 110.5
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Value must be between 40 and 600 mg/dl."
    );
  });

  // Test 8: Future date
  test("Should reject a future reading date", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    const dateString = [
      futureDate.getFullYear(),
      String(futureDate.getMonth() + 1).padStart(2, "0"),
      String(futureDate.getDate()).padStart(2, "0")
    ].join("-");

    const response = await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        readingDate: dateString,
        slot: "MORNING",
        glucoseValue: 110
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Date cannot be in the future."
    );
  });

  // Test 9: Duplicate reading
  test("Should reject a duplicate reading for the same date and slot", async () => {
    prisma.reading.findUnique.mockResolvedValue({
      id: "existing-reading"
    });

    const response = await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        readingDate: "2026-11-13",
        slot: "AFTER_LUNCH",
        glucoseValue: 120
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe(
      "You already have an After lunch reading for this date."
    );
    expect(prisma.reading.create).not.toHaveBeenCalled();
  });

  // Test 10: Successful reading creation
  test("Should successfully create a valid glucose reading", async () => {
    const savedReading = {
      id: "22222222-2222-4222-8222-222222222222",
      userId: testUserId,
      readingDate: new Date("2026-11-13T00:00:00.000Z"),
      slot: "MORNING",
      glucoseValue: 120
    };

    prisma.reading.findUnique.mockResolvedValue(null);
    prisma.reading.count.mockResolvedValue(0);
    prisma.reading.create.mockResolvedValue(savedReading);

    const response = await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        readingDate: "2026-11-13",
        slot: "MORNING",
        glucoseValue: 120
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Glucose reading added successfully."
    );
    expect(response.body.reading.glucoseValue).toBe(120);

    expect(prisma.reading.create).toHaveBeenCalledWith({
      data: {
        userId: testUserId,
        readingDate: new Date("2026-11-13T00:00:00.000Z"),
        slot: "MORNING",
        glucoseValue: 120
      }
    });
  });

  // Test 11: Retrieve only the logged-in user's readings
  test("Should retrieve readings belonging only to the logged-in user", async () => {
    const userReadings = [
      {
        id: "22222222-2222-4222-8222-222222222222",
        userId: testUserId,
        readingDate: new Date("2026-11-13T00:00:00.000Z"),
        slot: "MORNING",
        glucoseValue: 120
      }
    ];

    prisma.reading.findMany.mockResolvedValue(userReadings);

    const response = await request(app)
      .get("/api/readings")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.readings).toHaveLength(1);

    expect(prisma.reading.findMany).toHaveBeenCalledWith({
      where: { userId: testUserId },
      orderBy: [
        { readingDate: "desc" },
        { createdAt: "desc" }
      ]
    });
  });

  // Test 12: Prevent access to another user's reading
  test("Should not allow a user to retrieve another user's reading", async () => {
    prisma.reading.findFirst.mockResolvedValue(null);

    const response = await request(app)
      .get("/api/readings/33333333-3333-4333-8333-333333333333")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe(
      "Glucose reading not found."
    );

    expect(prisma.reading.findFirst).toHaveBeenCalledWith({
      where: {
        id: "33333333-3333-4333-8333-333333333333",
        userId: testUserId
      }
    });
  });
});
