import express from "express";
import { getProfile, getAllUsers } from "../controllers/user.controller";
import { protect } from "../middleware/auth";

const router = express.Router();

router.get("/profile", protect, getProfile);
//router.get("/", getAllUsers); // optional for testing/admin

export default router;
