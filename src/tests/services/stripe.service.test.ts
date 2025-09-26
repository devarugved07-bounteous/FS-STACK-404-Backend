import Stripe from "stripe";

// Mock stripe
jest.mock("stripe", () => {
  return jest.fn().mockImplementation((apiKey) => ({
    apiKey,
  }));
});

describe("Stripe Service", () => {
  it("should initialize Stripe with the secret key", () => {
    // Mock process.env
    const originalEnv = process.env;
    process.env.STRIPE_SECRET_KEY = "test_secret_key";

    // Import after setting env
    const stripeService = require("../../services/stripe.service").default;

    expect(Stripe).toHaveBeenCalledWith("test_secret_key", {
      apiVersion: "2025-08-27.basil",
    });
    expect(stripeService).toBeDefined();

    // Restore env
    process.env = originalEnv;
  });
});
