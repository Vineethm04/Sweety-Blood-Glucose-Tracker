require("dotenv").config();

const bcrypt = require("bcrypt");
const prisma = require("../src/config/prisma");

const DEMO_USER = {
  name: "Sweety Demo",
  email: "demo@sweety.com",
  password: "SweetyDemo@123"
};

async function main() {
  console.log("Starting database seeding...");

  // Hash the demo user's password
  const hashedPassword = await bcrypt.hash(
    DEMO_USER.password,
    12
  );

  // Create or update the demo user
  const user = await prisma.user.upsert({
    where: {
      email: DEMO_USER.email
    },
    update: {
      name: DEMO_USER.name,
      password: hashedPassword
    },
    create: {
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      password: hashedPassword
    }
  });

  console.log("Demo user created or updated.");

  // Generate dates for today and yesterday
  const today = new Date();
  const todayDate = new Date(
    Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    )
  );

  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);

  // Sample glucose readings
  const sampleReadings = [
    {
      readingDate: yesterdayDate,
      slot: "MORNING",
      glucoseValue: 98
    },
    {
      readingDate: yesterdayDate,
      slot: "AFTER_BREAKFAST",
      glucoseValue: 135
    },
    {
      readingDate: yesterdayDate,
      slot: "AFTER_LUNCH",
      glucoseValue: 121
    },
    {
      readingDate: yesterdayDate,
      slot: "AFTER_DINNER",
      glucoseValue: 116
    },
    {
      readingDate: todayDate,
      slot: "MORNING",
      glucoseValue: 105
    },
    {
      readingDate: todayDate,
      slot: "AFTER_BREAKFAST",
      glucoseValue: 142
    },
    {
      readingDate: todayDate,
      slot: "AFTER_LUNCH",
      glucoseValue: 128
    }
  ];

  // Insert or update readings without creating duplicates
  for (const reading of sampleReadings) {
    await prisma.reading.upsert({
      where: {
        userId_readingDate_slot: {
          userId: user.id,
          readingDate: reading.readingDate,
          slot: reading.slot
        }
      },
      update: {
        glucoseValue: reading.glucoseValue
      },
      create: {
        userId: user.id,
        readingDate: reading.readingDate,
        slot: reading.slot,
        glucoseValue: reading.glucoseValue
      }
    });
  }

  console.log("Seven sample readings created or updated.");
  console.log("Database seeding completed successfully.");

  console.log("\nDemo Login Details:");
  console.log("Email:", DEMO_USER.email);
  console.log("Password:", DEMO_USER.password);
}

main()
  .catch((error) => {
    console.error("Database seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
