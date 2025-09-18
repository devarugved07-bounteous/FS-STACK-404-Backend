import express from "express";
import { getAllContent, getContentByCategory, getContentById } from "../controllers/content.controller";

const router = express.Router();

router.get("/", getAllContent);
router.get("/category/:category", getContentByCategory);
router.get("/:id", getContentById);

export default router;
