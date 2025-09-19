import express from "express";
import {
  likeContent,
  addComment,
  addReview,
  getComments,
  getReviews,
  getAllContent,
  getContentByCategory,
  getContentById,
} from "../controllers/content.controller";
import { protect } from "../middleware/auth";

const router = express.Router();

// ✅ Get all content
router.get("/", getAllContent);

// ✅ Get content by category
router.get("/category/:category", getContentByCategory);

// ✅ Get content by ID
router.get("/:id", getContentById);

// ✅ Like a content
router.post("/:id/like", protect, likeContent);

// ✅ Add comment
router.post("/:id/comment", protect, addComment);

// ✅ Add review (movies only)
router.post("/:id/review", protect, addReview);

// ✅ Get comments
router.get("/:id/comments", getComments);

// ✅ Get reviews
router.get("/:id/reviews", getReviews);

export default router;
