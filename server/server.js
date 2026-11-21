
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./config/firebase.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to SUPERB MEGA GROUP Backend!"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running!"
  });
});

app.get("/api/firebase-test", async (req, res) => {
  try {
    await db.collection("connection_test").doc("test").set({
      project: "SUPERB MEGA GROUP",
      connected: true,
      createdAt: new Date()
    });

    res.json({
      success: true,
      message: "Firebase Connected Successfully!"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Firebase Connection Failed"
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`SUPERB MEGA GROUP Server running on port ${PORT}`);
});
