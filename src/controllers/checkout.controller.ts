import { Request, Response } from "express";
import Cart from "../models/Cart";
import Checkout from "../models/Checkout";

interface AuthRequest extends Request {
  user?: any;
}

export const checkout = async (req: AuthRequest, res: Response) => {
  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart || cart.items.length === 0) return res.status(400).json({ message: "Cart is empty" });

  const total = cart.items.reduce((sum, item) => sum + item.price, 0);

  const order = new Checkout({
    userId: req.user._id,
    items: cart.items,
    total,
  });

  await order.save();

  // Clear cart
  cart.items.splice(0, cart.items.length); // clears all items correctly
await cart.save();


  res.json({ message: "Checkout complete", order });
};
