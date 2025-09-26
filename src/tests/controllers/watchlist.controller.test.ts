import request from "supertest";
import express from "express";
import watchlistRouter from "../../routes/watchlist.routes";
import User from "../../models/User";
import mongoose from "mongoose";

// Mock User model
jest.mock("../../models/User");

// Mock auth
jest.mock("../../middleware/auth", () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: "userId123" };
    next();
  }),
}));

// Setup app
const app = express();
app.use(express.json());
app.use("/api/watchlist", watchlistRouter);

describe("Watchlist Controller", () => {
  let mockQuery: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = {
      populate: jest.fn(),
    };
    (User.findById as jest.Mock).mockReturnValue(mockQuery);
  });

  // -----------------------------
  // GET WATCHLIST
  // -----------------------------
  it("should get watchlist successfully", async () => {
    const mockUser = {
      _id: "userId123",
      watchlist: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
    };
    mockQuery.populate.mockResolvedValue(mockUser);

    const res = await request(app).get("/api/watchlist/");

    expect(res.statusCode).toBe(200);
    expect(res.body.watchlist).toEqual(["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]);
  });

  it("should return 404 if user not found", async () => {
    mockQuery.populate.mockResolvedValue(null);

    const res = await request(app).get("/api/watchlist/");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("User not found");
  });

  it("should handle error in getWatchlist", async () => {
    mockQuery.populate.mockRejectedValue(new Error("DB Error"));

    const res = await request(app).get("/api/watchlist/");

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Error fetching watchlist");
  });

  // -----------------------------
  // ADD TO WATCHLIST
  // -----------------------------
  it("should add to watchlist successfully", async () => {
    const mockUser = {
      _id: "userId123",
      watchlist: [],
      save: jest.fn().mockResolvedValue(true),
    };
    (User.findById as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(app).post("/api/watchlist/507f1f77bcf86cd799439011");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Content added to watchlist");
    expect(mockUser.watchlist.map((id: mongoose.Types.ObjectId) => id.toString())).toContain("507f1f77bcf86cd799439011");
  });

  it("should return 400 for invalid contentId", async () => {
    const res = await request(app).post("/api/watchlist/invalid");

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid content ID");
  });

  it("should return 400 if already in watchlist", async () => {
    const mockUser = {
      _id: "userId123",
      watchlist: [new mongoose.Types.ObjectId("507f1f77bcf86cd799439011")],
      save: jest.fn(),
    };
    (User.findById as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(app).post("/api/watchlist/507f1f77bcf86cd799439011");

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Content already in watchlist");
  });

  it("should return 404 if user not found for add", async () => {
    (User.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).post("/api/watchlist/507f1f77bcf86cd799439011");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("User not found");
  });

  // -----------------------------
  // REMOVE FROM WATCHLIST
  // -----------------------------
  it("should remove from watchlist successfully", async () => {
    const mockUser = {
      _id: "userId123",
      watchlist: [new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"), new mongoose.Types.ObjectId("507f1f77bcf86cd799439012")],
      save: jest.fn().mockResolvedValue(true),
    };
    (User.findById as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(app).delete("/api/watchlist/507f1f77bcf86cd799439011");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Content removed from watchlist");
    expect(mockUser.watchlist.map((id: mongoose.Types.ObjectId) => id.toString())).not.toContain("507f1f77bcf86cd799439011");
  });

  it("should return 400 for invalid contentId in remove", async () => {
    const res = await request(app).delete("/api/watchlist/invalid");

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid content ID");
  });

  it("should return 404 if user not found for remove", async () => {
    (User.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).delete("/api/watchlist/507f1f77bcf86cd799439011");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("User not found");
  });
});
