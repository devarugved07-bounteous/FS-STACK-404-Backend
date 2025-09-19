import express from "express";
import { createCheckoutSession } from "../controllers/stripe.controller";
import { checkout } from "../controllers/checkout.controller";
import { protect } from "../middleware/auth";

const router = express.Router();
router.post("/", protect, checkout);
router.post("/stripe", protect, createCheckoutSession);
export default router;
