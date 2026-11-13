# Sweety - Blood Glucose Tracker

## 1. Installation

First, clone the repository and move into the project folder:

```bash
git clone https://github.com/Vineethm04/Sweety-Blood-Glucose-Tracker.git
cd Sweety-Blood-Glucose-Tracker
```

The project has separate frontend and backend applications, so their dependencies need to be installed separately.

**Backend installation:**

```bash
cd server
npm install
```

**Frontend installation:**

Open another terminal from the project root and run:

```bash
cd client
npm install
```

## 2. Database Setup

This project uses PostgreSQL for storing user accounts and glucose readings.

1. Make sure PostgreSQL is installed and running.
2. Create a database named `sweety_db`.

```sql
CREATE DATABASE sweety_db;
```

3. Inside the `server` folder, create a `.env` file using the provided `.env.example` file as a reference.

Add the following environment variables:

```env
DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/sweety_db?schema=public"
PORT=5000
JWT_SECRET="YOUR_JWT_SECRET"
```

Replace the placeholder values with your own PostgreSQL password and a secure JWT secret.

4. Open a terminal inside the `server` folder and run the following commands to set up the database tables:

```bash
npx prisma migrate deploy
npx prisma generate
```

5. To create the demo account and sample glucose readings, run:

```bash
npm run seed
```

You can use these credentials to explore the application:

- **Email:** demo@sweety.com
- **Password:** SweetyDemo@123

## 3. Running the Application

The frontend and backend need to run in separate terminals.

**Start the backend:**

Open a terminal inside the `server` folder:

```bash
npm run dev
```

The backend will start at `http://localhost:5000`.

**Start the frontend:**

Open another terminal inside the `client` folder:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`.

Open the frontend URL in your browser to start using Sweety.

## 4. Running Tests

I have used Jest and Supertest to test the backend APIs, including input validation and user data isolation.

To run the tests, open a terminal inside the `server` folder and execute:

```bash
npm test
```

## 5. Notes

**Assumptions made during development:**

- Although the role mentioned the MERN stack, I followed the assessment's specific requirement to use PostgreSQL instead of MongoDB, along with React, Node.js and Express.
- I used Prisma ORM to interact with PostgreSQL and manage database migrations, as it makes database operations easier to maintain.
- I chose JWT-based authentication so users can securely access their accounts without having to log in again for every API request.
- I treated each glucose reading as a calendar-date entry associated with one of the four predefined time slots, rather than storing a separate custom time for every reading.
- I interpreted the Monthly report as the previous complete calendar month, while the Month-to-date report covers the first day of the current month through the selected date.
- I used a local PostgreSQL database for development and testing, assuming that the application would be connected to a hosted database when deployed.

**What I would improve with more time:**

- I would like to explore analysing glucose patterns over longer periods and identifying recurring changes across different days and time slots.
- I would add meal and lifestyle tracking so users could record what they ate, their physical activity and sleep, and compare this information with their glucose readings.
- I would explore integration with compatible glucose monitoring devices to automatically import readings instead of requiring users to enter everything manually.
- I would improve the reporting experience by allowing users to securely share their records with healthcare professionals and receive feedback.
- I would also work on offline support so users can record readings without an internet connection and synchronise them once they are online again.

These are ideas for future development and are not part of the current implementation.


