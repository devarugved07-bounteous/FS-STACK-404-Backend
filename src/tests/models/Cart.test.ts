import Cart, { ICart } from "../../models/Cart";
import mongoose from "mongoose";

describe("Cart Model", () => {
  let cart: ICart;

  beforeEach(() => {
    cart = new Cart({
      userId: new mongoose.Types.ObjectId(),
      items: [],
    });
  });

  it("should create a new cart successfully", () => {
    expect(cart.userId).toBeDefined();
    expect(cart.items).toEqual([]);
  });

  it("should add an item to cart", () => {
    const item = {
      contentId: new mongoose.Types.ObjectId(),
      kind: "rent",
      price: 9.99,
    };
    cart.items.push(item);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].kind).toBe("rent");
    expect(cart.items[0].price).toBe(9.99);
  });

  it("should add another type of item (buy)", () => {
    const item = {
      contentId: new mongoose.Types.ObjectId(),
      kind: "buy",
      price: 19.99,
    };
    cart.items.push(item);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].kind).toBe("buy");
  });
});
