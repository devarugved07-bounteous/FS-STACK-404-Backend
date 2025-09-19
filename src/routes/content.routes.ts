import express from "express";
import {
  getAllContent,
  getContentByCategory,
  getContentById,
  searchContent,
  getSortedContent,
} from "../controllers/content.controller";

const router = express.Router();

// Base fetch
router.get("/", getAllContent);

// Search endpoint
router.get("/search", searchContent);

// NEW: combined filter + search + sort + pagination
router.get("/sorted/:category", getSortedContent);

// Category filter
router.get("/category/:category", getContentByCategory);

// Single content by ID
router.get("/:id", getContentById);

export default router;
