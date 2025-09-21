import express from "express";
import { createCheckoutSession, paymentdetails, stripeWebhookHandler } from "../controllers/stripe.controller";
import { protect } from "../middleware/auth";

const router = express.Router();

router.post('/create-checkout-session', protect, createCheckoutSession);
router.get('/payment-details',paymentdetails);
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);



export default router;
