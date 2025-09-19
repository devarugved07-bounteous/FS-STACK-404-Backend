import express from "express";
import { createCheckoutSession } from "../controllers/stripe.controller";
import { protect } from "../middleware/auth";

const router = express.Router();

router.post("/create-checkout-session", protect, createCheckoutSession);

export default router;
