import request from "supertest";
import express, { Request, Response } from "express";
import * as cartController from "../../controllers/cart.controller";
import Cart from "../../models/Cart";

// Mock the Cart model
jest.mock("../../models/Cart");

// Setup Express app for testing
const app = express();
app.use(express.json());

// Mock middleware to add user to request
const mockAuthMiddleware = (req: Request, res: Response, next: Function) => {
  (req as any).user = { id: "userId123" };
  next();
};

// Mount routes
app.post("/api/cart/add", mockAuthMiddleware, cartController.addToCart);
app.get("/api/cart", mockAuthMiddleware, cartController.getCart);
app.delete("/api/cart/:itemId", mockAuthMiddleware, cartController.removeFromCart);

describe("Cart Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------
  // ADD TO CART
  // -----------------------------
  it("should add an item to the cart", async () => {
    const mockCart = {
      items: [],
      save: jest.fn().mockResolvedValue(true),
    };
    (Cart.findOne as jest.Mock).mockResolvedValue(mockCart);
    (Cart as any).mockImplementation(() => mockCart);

    const res = await request(app)
      .post("/api/cart/add")
      .send({ contentId: "content123", kind: "movie", price: 10 });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Item added to cart");
    expect(mockCart.items.length).toBe(1);
  });

  it("should return error if item already exists", async () => {
    const mockCart = {
      items: [{ contentId: "content123", kind: "movie" }],
      save: jest.fn().mockResolvedValue(true),
    };
    (Cart.findOne as jest.Mock).mockResolvedValue(mockCart);

    const res = await request(app)
      .post("/api/cart/add")
      .send({ contentId: "content123", kind: "movie", price: 10 });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Item already in cart for this kind");
  });

  // -----------------------------
  // GET CART
  // -----------------------------
  it("should return cart items", async () => {
    (Cart.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        items: [{ contentId: "content123", kind: "movie", price: 10 }],
      }),
    });

    const res = await request(app).get("/api/cart");

    expect(res.statusCode).toBe(200);
    expect(res.body.items.length).toBe(1);
  });

  it("should return empty array if cart not found", async () => {
    (Cart.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app).get("/api/cart");

    expect(res.statusCode).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  // -----------------------------
  // REMOVE FROM CART
  // -----------------------------
  it("should remove item from cart", async () => {
    const mockCart = {
      items: [{ _id: "item123", contentId: "content123", kind: "movie", price: 10 }],
      save: jest.fn().mockResolvedValue(true),
    };
    (Cart.findOne as jest.Mock).mockResolvedValue(mockCart);

    const res = await request(app).delete("/api/cart/item123");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Item removed from cart");
    expect(mockCart.items.length).toBe(0);
  });

  it("should return 404 if item not found", async () => {
    const mockCart = {
      items: [{ _id: "item123", contentId: "content123", kind: "movie", price: 10 }],
      save: jest.fn().mockResolvedValue(true),
    };
    (Cart.findOne as jest.Mock).mockResolvedValue(mockCart);

    const res = await request(app).delete("/api/cart/item999");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Item not found in cart");
  });

  it("should return 404 if cart not found", async () => {
    (Cart.findOne as jest.Mock).mockResolvedValue(null);

    const res = await request(app).delete("/api/cart/item123");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Cart not found");
  });
});
