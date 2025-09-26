import request from "supertest";
import express from "express";
import userRouter from "../../routes/user.routes";
import User from "../../models/User";

// Mock the User model
jest.mock("../../models/User");

// Mock the auth middleware
jest.mock("../../middleware/auth", () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: "userId123", username: "testuser" };
    next();
  }),
}));

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use("/api/user", userRouter);

describe("User Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------
  // GET PROFILE
  // -----------------------------
  it("should get user profile successfully", async () => {
    const mockUser = {
      _id: "userId123",
      username: "testuser",
      dob: "2000-01-01",
      address: "Test St",
      watchlist: [],
    };
    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    const res = await request(app).get("/api/user/profile");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      id: "userId123",
      username: "testuser",
      dob: "2000-01-01",
      address: "Test St",
      watchlist: [],
    });
  });

  it("should return 404 if user not found", async () => {
    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app).get("/api/user/profile");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("User not found");
  });

  it("should handle error in getProfile", async () => {
    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error("DB Error")),
    });

    const res = await request(app).get("/api/user/profile");

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Server error");
  });
});
