import { Response } from "express";
import { Types } from "mongoose";
import Cart, { ICartItem } from "../models/Cart";
import { AuthRequest } from "../middleware/auth";

// Add to Cart
export const addToCart = async (req: AuthRequest, res: Response) => {
  try {
    const { contentId, kind, price } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID missing from token" });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const items = cart.items as Types.DocumentArray<ICartItem>;

    // Check if item with same contentId and kind already exists
    const existingItem = items.find(
      (item) =>
        item.contentId.toString() === contentId &&
        item.kind === kind
    );

    if (existingItem) {
      return res.status(400).json({ message: 'Item already in cart for this kind' });
    }

    items.push({ contentId, kind, price } as ICartItem);
    await cart.save();

    res.json({ message: "Item added to cart", cart });
  } catch (err) {
    res.status(500).json({ message: "Error adding to cart", error: err });
  }
};

// Get Cart
export const getCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID missing from token" });
    }

    const cart = await Cart.findOne({ userId }).populate("items.contentId");

    if (!cart) return res.json({ items: [] });

    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Error fetching cart", error: err });
  }
};

// Remove from Cart
export const removeFromCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { itemId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID missing from token" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const items = cart.items as Types.DocumentArray<ICartItem>;

    // Explicitly type `item` here to fix 'never' error
    const itemIndex = items.findIndex(
      (item: ICartItem) => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    items.splice(itemIndex, 1);
    cart.items = items;

    await cart.save();

    res.json({ message: "Item removed from cart", cart });
  } catch (err) {
    res.status(500).json({ message: "Error removing from cart", error: err });
  }
};
