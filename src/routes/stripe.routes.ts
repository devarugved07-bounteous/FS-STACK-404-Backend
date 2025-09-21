import express from "express";
import { createCheckoutSession, paymentdetails } from "../controllers/stripe.controller";
import { protect } from "../middleware/auth";

const router = express.Router();

router.post("/create-checkout-session", protect, createCheckoutSession);
router.get('/payment-details',paymentdetails);
export default router;
