import { Order, IOrder } from "../../models/Order";
import mongoose from "mongoose";

describe("Order Model", () => {
  let order: IOrder;

  beforeEach(() => {
    order = new Order({
      userId: new mongoose.Types.ObjectId(),
      items: [],
    });
  });

  it("should create a new order successfully", () => {
    expect(order.userId).toBeDefined();
    expect(order.items).toEqual([]);
  });

  it("should add an item to order", () => {
    const item = {
      name: "Test Product",
      price: 9.99,
    };
    order.items.push(item);
    expect(order.items).toHaveLength(1);
    expect(order.items[0].name).toBe("Test Product");
    expect(order.items[0].price).toBe(9.99);
  });

  it("should set payment details", () => {
    order.paymentIntentId = "pi_123";
    order.amount_total = 19.98;
    order.currency = "usd";
    order.status = "paid";
    expect(order.paymentIntentId).toBe("pi_123");
    expect(order.amount_total).toBe(19.98);
    expect(order.currency).toBe("usd");
    expect(order.status).toBe("paid");
  });
});
