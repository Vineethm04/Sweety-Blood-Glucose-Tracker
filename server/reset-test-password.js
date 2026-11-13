require("dotenv").config();

const bcrypt = require("bcrypt");
const readline = require("readline");
const prisma = require("./src/config/prisma");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (question) =>
  new Promise((resolve) => rl.question(question, resolve));

async function resetPassword() {
  try {
    const email = "vineeth.test@example.com";

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log("Test account not found.");
      return;
    }

    const newPassword = await ask("Enter your new password: ");

    if (newPassword.length < 8 || newPassword.length > 72) {
      console.log("Password must be between 8 and 72 characters.");
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    console.log("\nPassword reset successfully!");
    console.log("Email:", email);
    console.log("Your existing glucose readings are unchanged.");
  } catch (error) {
    console.error("Password reset failed:", error.message);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

resetPassword();
