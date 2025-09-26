import User, { IUser } from "../../models/User";
import bcrypt from "bcrypt";

// Mock bcrypt
jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe("User Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should match password correctly", async () => {
    const user = new User({
      username: "testuser",
      password: "hashedpassword",
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await user.matchPassword("password123");

    expect(bcrypt.compare).toHaveBeenCalledWith("password123", "hashedpassword");
    expect(result).toBe(true);
  });
});
