import Stripe from "stripe";
import dotenv from "dotenv";

import { Request, Response } from "express";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2022-11-15" as any,
});

export const createCheckoutSession = async (req: any, res: Response) => {
  try {
    const { items } = req.body;

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
      cancel_url: "http://localhost:3000/cancel",
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: "Stripe checkout failed", error: err });
  }
};


export const paymentdetails =async (req:any, res:Response) => {
  const sessionId = req.query.session_id;
  if (!sessionId) {
    return res.status(400).json({ error: 'session_id is required' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    // Optionally retrieve payment & customer info here
    
    res.json(session);
  } catch (error: unknown) {
  if (error instanceof Error) {
    res.status(500).json({ error: error.message });
  } else {
    res.status(500).json({ error: 'Unknown error' });
  }
}

};