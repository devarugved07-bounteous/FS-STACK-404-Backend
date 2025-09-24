import { Response } from "express";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth"; // Assumes you moved AuthRequest there

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      id: user._id,
      username: user.username,
      dob: user.dob,
      address: user.address,
      watchlist: user.watchlist || [],
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
