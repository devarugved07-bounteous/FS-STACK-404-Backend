import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import contentRoutes from "./routes/content.routes";
import cartRoutes from "./routes/cart.routes";
import checkoutRoutes from "./routes/checkout.routes";
import stripeRoutes from "./routes/stripe.routes";

// ...


dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev")); // Logs all incoming requests

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/stripe", stripeRoutes);

// MongoDB Atlas connection
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("❌ MONGO_URI not set in .env");
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => console.log("✅ MongoDB connected (Atlas)"))
  .catch((err) => console.error("❌ DB connection failed:", err));

export default app;
