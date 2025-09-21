import Stripe from "stripe";
import dotenv from "dotenv";

import { Request, Response } from "express";

import Cart from "../models/Cart"; // Adjust import path if needed
import { Order } from "../models/Order"; // Adjust import path if needed

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2022-11-15" as any,
});

export const createCheckoutSession = async (req: any, res: Response) => {
  try {
    const { items, userId } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: items.map((item: any) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.contentId.title,
          },
          unit_amount: item.price * 100, // in cents
        },
        quantity: 1,
      })),
      success_url: "http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:5173/checkout",
      client_reference_id: userId, // Pass userId here for webhook identification
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: "Stripe checkout failed", error: err });
  }
};

export const paymentdetails = async (req: any, res: Response) => {
  const sessionId = req.query.session_id;
  if (!sessionId) {
    return res.status(400).json({ error: "session_id is required" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    // Optionally retrieve payment & customer info here

    res.json(session);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Unknown error" });
    }
  }
};

export const stripeWebhookHandler = async (req: any, res: Response) => {
  console.log('Webhook received:', JSON.stringify(req.body, null, 2));
  try {
    const event = req.body;
    if (event.type === 'checkout.session.completed') {
      console.log('checkout.session.completed event:', event.data.object);

      const session = event.data.object;
      const userId = session.client_reference_id;

      if (userId) {
        try {
          // Create order in the database
          await Order.create({
            userId,
            items: session.display_items || [],
            paymentIntentId: session.payment_intent,
            amount_total: session.amount_total,
            currency: session.currency,
            status: 'paid',
            createdAt: new Date(),
          });

          // Clear the cart for the user
          await Cart.findOneAndUpdate({ userId }, { items: [] });

          console.log('Order created and cart cleared for user:', userId);
        } catch (error) {
          console.error('Error creating order or clearing cart:', error);
        }
      }
    }
    res.status(200).send('Webhook received');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(400).send('Webhook error');
  }
};
