import { Response } from "express";
import Cart, { ICartItem } from "../models/Cart";
import Checkout from "../models/Checkout";
import { AuthRequest } from "../middleware/auth";

export const checkout = async (req: AuthRequest, res: Response) => {
  try {
    // ✅ Use user.id from JWT token
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID missing from token" });
    }

    // Fetch user's cart and populate content details
    const cart = await Cart.findOne({ userId }).populate("items.contentId");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Calculate total
    const total = cart.items.reduce((sum, item: ICartItem) => sum + item.price, 0);

    // Create checkout/order
    const order = new Checkout({
      userId,
      items: cart.items,
      total,
    });

    await order.save();

    // ✅ Clear cart items safely
    cart.items.splice(0, cart.items.length);
    await cart.save();

    res.json({ message: "Checkout complete", order });
  } catch (err) {
    res.status(500).json({ message: "Error during checkout", error: err });
  }
};
