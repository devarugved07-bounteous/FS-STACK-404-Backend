import { Request, Response } from "express";
import User from "../models/User";
import Content from "../models/Content";
 
interface AuthRequest extends Request {
  user?: any;
}
 
// GET /watchlist
export const getWatchlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
 
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
 
    const user = await User.findById(userId);
 
    if (!user) return res.status(404).json({ message: "User not found" });
 
    // Prevent duplicates
    if (user.watchlist.includes(contentId)) {
      return res.status(400).json({ message: "Content already in watchlist" });
    }
 
    user.watchlist.push(contentId);
    await user.save();
 
    res.status(200).json({ message: "Content added to watchlist", watchlist: user.watchlist });
  } catch (err) {
    res.status(500).json({ message: "Error adding to watchlist", error: err });
  }
};
 
// DELETE /watchlist/:contentId
export const removeFromWatchlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { contentId } = req.params;
 
    const user = await User.findById(userId);
 
    if (!user) return res.status(404).json({ message: "User not found" });
 
    user.watchlist = user.watchlist.filter(
      (id: any) => id.toString() !== contentId
    );
    await user.save();
 
    res.status(200).json({ message: "Content removed from watchlist", watchlist: user.watchlist });
  } catch (err) {
    res.status(500).json({ message: "Error removing from watchlist", error: err });
  }
};
 