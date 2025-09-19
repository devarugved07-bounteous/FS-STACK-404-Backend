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
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: "Stripe checkout failed", error: err });
  }
};
