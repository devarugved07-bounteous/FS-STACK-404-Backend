import express from "express";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from "../controllers/watchlist.controller";
import { protect } from '../middleware/auth';
 
const router = express.Router();
 
router.get("/", protect, getWatchlist);
router.post("/:contentId", protect, addToWatchlist);
router.delete("/:contentId", protect, removeFromWatchlist);
 
export default router;