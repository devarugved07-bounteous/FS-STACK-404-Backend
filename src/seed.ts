import mongoose from "mongoose";
import dotenv from "dotenv";
import Content from "./models/Content";
import User from "./models/User";

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/social-media");
    console.log("✅ MongoDB connected for seeding");

    // Clear old data
    await User.deleteMany();
    await Content.deleteMany();
    console.log("🗑️ Cleared old data");

    // Create dummy users
    const user1 = await User.create({
      username: "Alice",
      password: "password123",
      dob: new Date("1995-01-01"),
      address: "Mumbai, India",
    });

    const user2 = await User.create({
      username: "Bob",
      password: "password123",
      dob: new Date("1998-05-12"),
      address: "Delhi, India",
    });

    console.log("✅ Users created");

    // Create contents with likes/comments/reviews
    const contents = [
      {
        title: "Inception",
        description: "A mind-bending thriller by Christopher Nolan.",
        category: "movie",
        price: 299,
        url: "https://example.com/inception.mp4",
        thumbnail: "https://example.com/inception.jpg",
        likes: [user1._id, user2._id],
        comments: [
          { userId: user1._id, text: "Awesome movie!", createdAt: new Date() },
        ],
        reviews: [
          { userId: user2._id, text: "Mind-blowing plot!", createdAt: new Date() },
        ],
      },
      {
        title: "Interstellar",
        description: "A sci-fi journey through space and time.",
        category: "movie",
        price: 349,
        url: "https://example.com/interstellar.mp4",
        thumbnail: "https://example.com/interstellar.jpg",
        likes: [user2._id],
        comments: [
          { userId: user2._id, text: "Loved the visuals!", createdAt: new Date() },
        ],
        reviews: [
          { userId: user1._id, text: "Amazing storytelling!", createdAt: new Date() },
        ],
      },
      {
        title: "React Basics Tutorial",
        description: "Learn the basics of React in 30 minutes.",
        category: "video",
        price: 0,
        url: "https://example.com/react-tutorial.mp4",
        thumbnail: "https://example.com/react.jpg",
        likes: [user1._id],
        comments: [
          { userId: user2._id, text: "Very helpful tutorial!", createdAt: new Date() },
        ],
      },
      {
        title: "Node.js Live Coding",
        description: "Watch me build a Node.js app live!",
        category: "live",
        price: 0,
        url: "https://example.com/node-live",
        thumbnail: "https://example.com/node-live.jpg",
        likes: [],
        comments: [],
      },
    ];

    await Content.insertMany(contents);
    console.log("✅ Seed data inserted with likes, comments, and reviews");

    process.exit();
  } catch (err) {
    console.error("❌ Seeding failed", err);
    process.exit(1);
  }
};

seed();
