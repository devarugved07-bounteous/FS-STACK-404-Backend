import { Response } from "express";
import Cart, { ICartItem } from "../models/Cart";
import Checkout from "../models/Checkout";
import { AuthRequest } from "../middleware/auth";

export const checkout = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID missing from token" });
    }

    const cart = await Cart.findOne({ userId }).populate("items.contentId");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Calculate total price
    const total = cart.items.reduce((sum: number, item: ICartItem) => sum + item.price, 0);

    const order = new Checkout({
      userId,
      items: cart.items,
      total,
    });

    await order.save();

    res.json({ message: "Checkout complete", order });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "VersionError") {
      console.error("Version conflict during checkout:", err);
      return res.status(409).json({
        message: "Conflict: Cart or order was updated elsewhere. Please try again.",
      });
    }
    if (err instanceof Error) {
      console.error("Checkout error:", err);
      res.status(500).json({ message: "Error during checkout", error: err.message });
    } else {
      console.error("Unknown error during checkout:", err);
      res.status(500).json({ message: "Error during checkout" });
    }
  }
};
