import request from "supertest";
import express, { Request, Response } from "express";
import * as authController from "../../controllers/auth.controller";
import User from "../../models/User";
import jwt from "jsonwebtoken";

// Setup Express app for testing
const app = express();
app.use(express.json());

// Mount routes for testing
app.post("/api/auth/register", authController.register);
app.post("/api/auth/login", authController.login);
app.post("/api/auth/refresh", authController.refreshToken);
app.post("/api/auth/logout", authController.logout);

// Mock the User model
jest.mock("../../models/User");

// Mock JWT
jest.mock("jsonwebtoken");

describe("Auth Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------
  // REGISTER
  // -----------------------------
  it("should register a user successfully", async () => {
    // Mock save
    (User.prototype.save as jest.Mock).mockResolvedValue(true);

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        username: "testuser",
        password: "Test@123",
        dob: "2000-01-01",
        address: "Test St",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("User registered successfully");
  });

  // -----------------------------
  // LOGIN
  // -----------------------------
  it("should login successfully", async () => {
    // Mock findOne
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: "userId123",
      username: "testuser",
      dob: "2000-01-01",
      address: "Test St",
      matchPassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true),
    });

    (jwt.sign as jest.Mock).mockReturnValue("mockToken");

    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "testuser", password: "Test@123" });

    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBe("mockToken");
    expect(res.body.refreshToken).toBe("mockToken");
    expect(res.body.user.username).toBe("testuser");
  });

  it("should fail login with invalid credentials", async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "wrong", password: "badpass" });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  // -----------------------------
  // REFRESH TOKEN
  // -----------------------------
  it("should refresh token successfully", async () => {
    const mockUser = {
      refreshToken: "oldToken",
    };

    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (jwt.verify as jest.Mock).mockImplementation((_token, _secret, _options, cb) => {
      cb(null, { id: "userId123" });
    });
    (jwt.sign as jest.Mock).mockReturnValue("newAccessToken");

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ token: "oldToken" });

    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBe("newAccessToken");
  });

  it("should fail refresh token with invalid token", async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ token: "invalidToken" });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Invalid refresh token");
  });

  // -----------------------------
  // LOGOUT
  // -----------------------------
  it("should logout successfully", async () => {
    const mockUser = {
      refreshToken: "someToken",
      save: jest.fn().mockResolvedValue(true),
    };

    (User.findOne as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(app)
      .post("/api/auth/logout")
      .send({ token: "someToken" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Logged out successfully");
  });
});
