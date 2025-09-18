import { Request, Response } from "express";
import Cart from "../models/Cart";

interface AuthRequest extends Request {
  user?: any;
}

// Get current user's cart
export const getCart = async (req: AuthRequest, res: Response) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id }).populate("items.contentId");
    if (!cart) return res.status(404).json({ message: "Cart not found" });
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Error fetching cart", error: err });
  }
};

// Add item to cart
export const addToCart = async (req: AuthRequest, res: Response) => {
  try {
    const { contentId, kind, price } = req.body;
    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    // ✅ Push plain object; Mongoose will assign _id automatically
    cart.items.push({ contentId, kind, price });

    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Error adding to cart", error: err });
  }
};


export const removeFromCart = async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.params;

    if (!req.user) return res.status(401).json({ message: "Not authorized" });

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    // Find index of the item in the array
    const index = cart.items.findIndex((i) => i._id.toString() === itemId);
    if (index === -1) return res.status(404).json({ message: "Item not found in cart" });

    // Remove the item using splice
    cart.items.splice(index, 1);
    await cart.save();

    res.json({ message: "Item removed successfully", cart });
  } catch (err: any) {
    console.error("Remove from cart error:", err);
    res.status(500).json({ message: "Error removing from cart", error: err.message });
  }
};