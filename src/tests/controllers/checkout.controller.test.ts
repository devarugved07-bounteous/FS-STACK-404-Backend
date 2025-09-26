import request from "supertest";
import express, { Request, Response } from "express";
import * as checkoutController from "../../controllers/checkout.controller";
import Cart from "../../models/Cart";
import Checkout from "../../models/Checkout";

// Mock the Cart and Checkout models
jest.mock("../../models/Cart");
jest.mock("../../models/Checkout");


// Setup Express app for testing
const app = express();
app.use(express.json());

// Mock middleware to add user to request
const mockAuthMiddleware = (req: Request, res: Response, next: Function) => {
  (req as any).user = { id: "userId123" };
  next();
};

// Mount route
app.post("/api/checkout", mockAuthMiddleware, checkoutController.checkout);

describe("Checkout Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------
  // SUCCESSFUL CHECKOUT
  // -----------------------------
  it("should complete checkout successfully", async () => {
    // Mock cart with items
    const mockCart = {
      items: [
        { contentId: "content1", kind: "movie", price: 10 },
        { contentId: "content2", kind: "series", price: 20 },
      ],
      populate: jest.fn().mockResolvedValue({
        items: [
          { contentId: "content1", kind: "movie", price: 10 },
          { contentId: "content2", kind: "series", price: 20 },
        ],
      }),
    };
    (Cart.findOne as jest.Mock).mockReturnValue(mockCart);

    // Mock Checkout save
    const mockOrder = {
      _id: "order123",
      userId: "userId123",
      items: mockCart.items,
      total: 30,
      save: jest.fn().mockResolvedValue(true),
    };
    (Checkout as any).mockImplementation(() => mockOrder);

    const res = await request(app).post("/api/checkout");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Checkout complete");
    expect(res.body.order).toMatchObject({
      _id: "order123",
      userId: "userId123",
      items: [
        { contentId: "content1", kind: "movie", price: 10 },
        { contentId: "content2", kind: "series", price: 20 },
      ],
      total: 30,
    });
  });

  // -----------------------------
  // EMPTY CART
  // -----------------------------
  it("should return 400 if cart is empty", async () => {
    const mockCart = {
      items: [],
      populate: jest.fn().mockResolvedValue({ items: [] }),
    };
    (Cart.findOne as jest.Mock).mockReturnValue(mockCart);

    const res = await request(app).post("/api/checkout");

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Cart is empty");
  });

  // -----------------------------
  // MISSING USER
  // -----------------------------
  it("should return 400 if userId missing", async () => {
    const appNoUser = express();
    appNoUser.use(express.json());
    appNoUser.post("/api/checkout", checkoutController.checkout);

    const res = await request(appNoUser).post("/api/checkout");

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("User ID missing from token");
  });

  // -----------------------------
  // VERSION ERROR
  // -----------------------------
  it("should handle VersionError gracefully", async () => {
    const versionError = new Error("Version conflict") as any;
    versionError.name = "VersionError";

    const mockCart = {
      items: [{ contentId: "content1", kind: "movie", price: 10 }],
      populate: jest.fn().mockResolvedValue({ items: [{ contentId: "content1", kind: "movie", price: 10 }] }),
    };
    (Cart.findOne as jest.Mock).mockReturnValue(mockCart);

    const mockOrder = { save: jest.fn().mockRejectedValue(versionError) };
    (Checkout as any).mockImplementation(() => mockOrder);

    const res = await request(app).post("/api/checkout");

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe(
      "Conflict: Cart or order was updated elsewhere. Please try again."
    );
  });

  // -----------------------------
  // GENERIC ERROR
  // -----------------------------
  it("should handle generic errors", async () => {
    const mockCart = {
      items: [{ contentId: "content1", kind: "movie", price: 10 }],
      populate: jest.fn().mockResolvedValue({ items: [{ contentId: "content1", kind: "movie", price: 10 }] }),
    };
    (Cart.findOne as jest.Mock).mockReturnValue(mockCart);

    const genericError = new Error("Some unexpected error");
    const mockOrder = { save: jest.fn().mockRejectedValue(genericError) };
    (Checkout as any).mockImplementation(() => mockOrder);

    const res = await request(app).post("/api/checkout");

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Error during checkout");
    expect(res.body.error).toBe("Some unexpected error");
  });
});
