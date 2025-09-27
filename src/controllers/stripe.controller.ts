import Stripe from "stripe";
import dotenv from "dotenv";
import { Request, Response } from "express";
import { Stripe as StripeNamespace } from "stripe";
 
import Cart from "../models/Cart";
import { Order } from "../models/Order";
 
dotenv.config();
 
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-08-27.basil",
});
 
interface CheckoutItem {
  contentId: {
    title: string;
  };
  price: number;
}
 
interface StripeSessionRequest extends Request {
  body: {
    items: CheckoutItem[];
    userId: string;
  };
}
 
interface StripeWebhookRequest extends Request {
  body: StripeNamespace.Event;
}
 
export const createCheckoutSession = async (
  req: StripeSessionRequest,
  res: Response
) => {
  try {
    const { items, userId } = req.body;
 
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: items.map((item) => ({
        price_data: {
          currency: "inr",
          product_data: {
            name: item.contentId.title,
          },
          unit_amount: Math.floor(item.price * 100), // in cents
        },
        quantity: 1,
      })),
      success_url:
        "https://frontend-fs-404-production.up.railway.app/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://frontend-fs-404-production.up.railway.app/checkout",
      client_reference_id: userId,
    });
 
    res.json({ url: session.url });
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: "Stripe checkout failed", error: err.message });
    } else {
      res.status(500).json({ message: "Stripe checkout failed" });
    }
  }
};
 
export const paymentdetails = async (req: Request, res: Response) => {
  const sessionId = req.query.session_id as string;
 
  if (!sessionId) {
    return res.status(400).json({ error: "session_id is required" });
  }
 
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.json(session);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Unknown error" });
    }
  }
};
 
interface Content {
  title: string;
  // add other fields if needed
}
 
export const stripeWebhookHandler = async (
  req: StripeWebhookRequest,
  res: Response
) => {
  console.log("Webhook received:", JSON.stringify(req.body, null, 2));
  try {
    const event = req.body;
 
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
 
      if (!userId) {
        console.warn("No userId in session.client_reference_id");
        return res.status(400).send("User ID missing in session");
      }
 
      try {
        // Fetch user's cart with populated product info
        const cart = await Cart.findOne({ userId }).populate("items.contentId");
 
        const orderItems = cart?.items.map(item => {
          // Type assertion that contentId is populated Content object
          const content = item.contentId as unknown as Content;
 
          return {
            name: typeof content === "object" && content !== null && "title" in content ? content.title : "Unknown product",
            price: item.price,
          };
        }) ?? [];
 
        // Save order with populated items info
        await Order.create({
          userId,
          items: orderItems,
          paymentIntentId: session.payment_intent?.toString() || "",
          amount_total: session.amount_total || 0,
          currency: session.currency || "usd",
          status: "paid",
          createdAt: new Date(),
        });
 
        // Clear the user's cart
        await Cart.findOneAndUpdate({ userId }, { items: [] });
 
        console.log("Order created and cart cleared for user:", userId);
      } catch (error) {
        console.error("Error creating order or clearing cart:", error);
        return res.status(500).send("Internal server error");
      }
    }
 
    res.status(200).send("Webhook received");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(400).send("Webhook error");
  }
};
 