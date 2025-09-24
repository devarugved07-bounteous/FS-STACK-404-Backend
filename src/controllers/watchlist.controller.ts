import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import User, { IUser } from "../models/User";
import Content from "../models/Content"; // Assuming it exists and is correctly typed

// Custom request interface with user field
interface AuthRequest extends Request {
  user?: {
    _id: Types.ObjectId;
  };
}

// GET /watchlist
export const getWatchlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId).populate("watchlist");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ watchlist: user.watchlist });
  } catch (err) {
    res.status(500).json({ message: "Error fetching watchlist", error: err });
  }
};

// POST /watchlist/:contentId
export const addToWatchlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { contentId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Validate contentId
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return res.status(400).json({ message: "Invalid content ID" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const contentObjectId = new mongoose.Types.ObjectId(contentId);

    // Prevent duplicates
    if (user.watchlist.some(id => id.equals(contentObjectId))) {
      return res.status(400).json({ message: "Content already in watchlist" });
    }

    user.watchlist.push(contentObjectId);
    await user.save();

    res.status(200).json({
      message: "Content added to watchlist",
      watchlist: user.watchlist,
    });
  } catch (err) {
    res.status(500).json({ message: "Error adding to watchlist", error: err });
  }
};

// DELETE /watchlist/:contentId
export const removeFromWatchlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { contentId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return res.status(400).json({ message: "Invalid content ID" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const contentObjectId = new mongoose.Types.ObjectId(contentId);

    user.watchlist = user.watchlist.filter(
      (id: Types.ObjectId) => !id.equals(contentObjectId)
    );

    await user.save();

    res.status(200).json({
      message: "Content removed from watchlist",
      watchlist: user.watchlist,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error removing from watchlist", error: err });
  }
};
