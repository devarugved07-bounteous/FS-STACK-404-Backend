import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

const generateAccessToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "secret", { expiresIn: "2d" });
};

const generateRefreshToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || "refreshsecret", { expiresIn: "7d" });
};

// Register
export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, dob, address } = req.body;
    const user = new User({ username, password, dob, address });
    await user.save();
    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error registering user", error: err });
  }
};

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const user: any = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      // Generate tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Save refreshToken in DB
      user.refreshToken = refreshToken;
      await user.save();

      res.json({
        accessToken,
        refreshToken,
        user: { id: user._id, username: user.username, dob: user.dob, address: user.address },
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err });
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ message: "Refresh token required" });

  try {
    const user = await User.findOne({ refreshToken: token });
    if (!user) return res.status(403).json({ message: "Invalid refresh token" });

    jwt.verify(token, process.env.JWT_REFRESH_SECRET || "refreshsecret", (err: any, decoded: any) => {
      if (err) return res.status(403).json({ message: "Invalid or expired refresh token" });

      const accessToken = generateAccessToken(decoded.id);
      res.json({ accessToken });
    });
  } catch (err) {
    res.status(500).json({ message: "Error refreshing token", error: err });
  }
};

// Logout
export const logout = async (req: Request, res: Response) => {
  const { token } = req.body;
  try {
    const user = await User.findOne({ refreshToken: token });
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error logging out", error: err });
  }
};
