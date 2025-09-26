import request from "supertest";
import express from "express";
import stripeRouter from "../../routes/stripe.routes";
import mongoose from "mongoose";

// Mock models
jest.mock("../../models/Cart", () => ({
  default: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock("../../models/Order", () => ({
  Order: {
    create: jest.fn(),
  },
}));

// Mock Stripe
jest.mock("stripe", () => {
  const mockCreate = jest.fn();
  const mockRetrieve = jest.fn();
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: mockCreate,
          retrieve: mockRetrieve,
        },
      },
    })),
  };
});

// Mock auth
jest.mock("../../middleware/auth", () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: "userId123" };
    next();
  }),
}));

// Import after mocks
import Cart from "../../models/Cart";
import { Order } from "../../models/Order";
import Stripe from "stripe";

// Access the mocks
const mockStripe = new Stripe("");
const mockCreate = mockStripe.checkout.sessions.create as jest.Mock;
const mockRetrieve = mockStripe.checkout.sessions.retrieve as jest.Mock;

// Setup app
const app = express();
app.use(express.json());
app.use("/api/stripe", stripeRouter);

describe("Stripe Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------
  // CREATE CHECKOUT SESSION
  // -----------------------------
  it("should create checkout session successfully", async () => {
    const mockSession = { url: "https://checkout.stripe.com/test" };
    mockCreate.mockResolvedValue(mockSession);

    const res = await request(app)
      .post("/api/stripe/create-checkout-session")
      .send({
        items: [{ contentId: { title: "Test Item" }, price: 10 }],
        userId: "user123",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.url).toBe("https://checkout.stripe.com/test");
  });

  it("should handle error in createCheckoutSession", async () => {
    mockCreate.mockRejectedValue(new Error("Stripe error"));

    const res = await request(app)
      .post("/api/stripe/create-checkout-session")
      .send({
        items: [{ contentId: { title: "Test Item" }, price: 10 }],
        userId: "user123",
      });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Stripe checkout failed");
  });

  // -----------------------------
  // PAYMENT DETAILS
  // -----------------------------
  it("should get payment details successfully", async () => {
    const mockSession = { id: "sess_123", amount_total: 1000 };
    mockRetrieve.mockResolvedValue(mockSession);

    const res = await request(app).get("/api/stripe/payment-details?session_id=sess_123");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockSession);
  });

  it("should return 400 if no session_id", async () => {
    const res = await request(app).get("/api/stripe/payment-details");

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("session_id is required");
  });

  it("should handle error in paymentdetails", async () => {
    mockRetrieve.mockRejectedValue(new Error("Retrieve error"));

    const res = await request(app).get("/api/stripe/payment-details?session_id=sess_123");

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("Retrieve error");
  });

  // -----------------------------
  // STRIPE WEBHOOK HANDLER
  // -----------------------------
  it("should handle checkout.session.completed webhook", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const mockCart = {
      items: [{ contentId: { title: "Test Product" }, price: 10 }],
    };
    Cart.findOne = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockCart),
    });
    Order.create = jest.fn().mockResolvedValue({});
    Cart.findOneAndUpdate = jest.fn().mockResolvedValue({});

    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: userId,
          payment_intent: "pi_123",
          amount_total: 1000,
          currency: "inr",
        },
      },
    };

    const res = await request(app)
      .post("/api/stripe/webhook")
      .send(event);

    expect(res.statusCode).toBe(200);
    expect(Order.create).toHaveBeenCalledWith({
      userId,
      items: [{ name: "Test Product", price: 10 }],
      paymentIntentId: "pi_123",
      amount_total: 1000,
      currency: "inr",
      status: "paid",
      createdAt: expect.any(Date),
    });
    expect(Cart.findOneAndUpdate).toHaveBeenCalledWith({ userId }, { items: [] });
  });

  it("should handle webhook with no userId", async () => {
    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: null,
        },
      },
    };

    const res = await request(app)
      .post("/api/stripe/webhook")
      .send(event);

    expect(res.statusCode).toBe(400);
  });

  it("should handle other event types", async () => {
    const event = {
      type: "other.event",
      data: {},
    };

    const res = await request(app)
      .post("/api/stripe/webhook")
      .send(event);

    expect(res.statusCode).toBe(200);
  });
});
