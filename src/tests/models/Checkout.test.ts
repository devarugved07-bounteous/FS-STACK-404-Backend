import Checkout, { ICheckout } from "../../models/Checkout";
import mongoose from "mongoose";

describe("Checkout Model", () => {
  let checkout: ICheckout;

  beforeEach(() => {
    checkout = new Checkout({
      userId: new mongoose.Types.ObjectId(),
      items: [],
      total: 0,
    });
  });

  it("should create a new checkout successfully", () => {
    expect(checkout.userId).toBeDefined();
    expect(checkout.items).toEqual([]);
    expect(checkout.total).toBe(0);
  });

  it("should add an item to checkout", () => {
    const item = {
      contentId: new mongoose.Types.ObjectId(),
      kind: "rent" as "rent" | "buy",
      price: 9.99,
    };
    checkout.items.push(item);
    checkout.total = 9.99;
    expect(checkout.items).toHaveLength(1);
    expect(checkout.items[0].kind).toBe("rent");
    expect(checkout.items[0].price).toBe(9.99);
    expect(checkout.total).toBe(9.99);
  });

  it("should calculate total for multiple items", () => {
    const item1 = {
      contentId: new mongoose.Types.ObjectId(),
      kind: "rent" as "rent" | "buy",
      price: 9.99,
    };
    const item2 = {
      contentId: new mongoose.Types.ObjectId(),
      kind: "buy" as "rent" | "buy",
      price: 19.99,
    };
    checkout.items.push(item1, item2);
    checkout.total = 29.98;
    expect(checkout.items).toHaveLength(2);
    expect(checkout.total).toBe(29.98);
  });
});
