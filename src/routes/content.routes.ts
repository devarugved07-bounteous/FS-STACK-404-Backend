import express from "express";
import {
  likeContent,
  dislikeContent,
  addComment,
  addReview,
  getComments,
  getReviews,
  getAllContent,
  getContentByCategory,
  getContentById,
  searchContent
} from "../controllers/content.controller";
import { protect } from "../middleware/auth";

const router = express.Router();

// ✅ Get all content
router.get("/", getAllContent);

// ✅ Get content by category
router.get("/category/:category", getContentByCategory);

router.get("/search",searchContent);

// ✅ Get content by ID
router.get("/:id", getContentById);


// ✅ Like a content
router.post("/:id/like", protect, likeContent);
router.delete('/:id/like', protect, dislikeContent);


// ✅ Add comment
router.post("/:id/comment", protect, addComment);

// ✅ Add review (movies only)
router.post("/:id/review", protect, addReview);

// ✅ Get comments
router.get("/:id/comments", getComments);

// ✅ Get reviews
router.get("/:id/reviews", getReviews);

export default router;
