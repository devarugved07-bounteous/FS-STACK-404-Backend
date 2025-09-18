import mongoose from "mongoose";
import dotenv from "dotenv";
import Content from "./models/Content";
import User from "./models/User";
import bcrypt from "bcrypt";

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("MongoDB connected for seeding");

    await User.deleteMany();
    await Content.deleteMany();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password123", salt);

    const users = [
      { username: "Harleen", password: hashedPassword, dob: new Date("2000-01-01"), address: "Mumbai, India" },
      { username: "Rugved", password: hashedPassword, dob: new Date("1995-01-01"), address: "Pune, India" },
    ];

    await User.insertMany(users);
    console.log("✅ Users created");

    const contents = [
      { title: "Inception", description: "A mind-bending thriller", category: "movie", price: 299, url: "https://example.com/inception.mp4", thumbnail: "https://example.com/inception.jpg" },
      { title: "Interstellar", description: "Sci-fi journey", category: "movie", price: 349, url: "https://example.com/interstellar.mp4", thumbnail: "https://example.com/interstellar.jpg" },
      { title: "React Tutorial", description: "Learn React", category: "video", price: 0, url: "https://example.com/react.mp4", thumbnail: "https://example.com/react.jpg" },
      { title: "Node Live", description: "Node.js live coding", category: "live", price: 0, url: "https://example.com/node-live", thumbnail: "https://example.com/node-live.jpg" },
    ];

    await Content.insertMany(contents);
    console.log("✅ Contents created");

    process.exit();
  } catch (err) {
    console.error("Seeding failed", err);
    process.exit(1);
  }
};

seed();
