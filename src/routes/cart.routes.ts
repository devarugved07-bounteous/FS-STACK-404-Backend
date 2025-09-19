import { Router } from "express";
import { addToCart, getCart, removeFromCart } from "../controllers/cart.controller";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/add", protect, addToCart);
router.get("/", protect, getCart);
router.delete("/remove/:itemId", protect, removeFromCart);

export default router;
