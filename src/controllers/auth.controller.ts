import { Request, Response } from "express";
import jwt, { VerifyErrors } from "jsonwebtoken";
import User, { IUser } from "../models/User";

// Define JWT Payload Type
interface JwtPayload {
  id: string;
}

// Token Generators
const generateAccessToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "secret", {
    expiresIn: "2d",
  });
};

const generateRefreshToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || "refreshsecret", {
    expiresIn: "7d",
  });
};

// -------------------------
// REGISTER
// -------------------------
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, dob, address } = req.body;
    const user = new User({ username, password, dob, address });
    await user.save();
    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error registering user", error: err });
  }
};

// -------------------------
// LOGIN
// -------------------------
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    const user = (await User.findOne({ username })) as IUser | null;

    if (user && (await user.matchPassword(password))) {
      const userId = user._id.toString();
      const accessToken = generateAccessToken(userId);
      const refreshToken = generateRefreshToken(userId);

      user.refreshToken = refreshToken;
      await user.save();

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          dob: user.dob,
          address: user.address,
        },
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err });
  }
};

// -------------------------
// REFRESH TOKEN
// -------------------------
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;
  if (!token) {
    res.status(401).json({ message: "Refresh token required" });
    return;
  }

  try {
    const user = (await User.findOne({ refreshToken: token })) as IUser | null;
    if (!user) {
      res.status(403).json({ message: "Invalid refresh token" });
      return;
    }

    jwt.verify(
      token,
      (process.env.JWT_REFRESH_SECRET || "refreshsecret") as string,
      {},
      (err: VerifyErrors | null, decoded: unknown) => {
        if (err || !decoded || typeof decoded !== "object" || !("id" in decoded)) {
          res.status(403).json({ message: "Invalid or expired refresh token" });
          return;
        }

        const { id } = decoded as JwtPayload;
        const accessToken = generateAccessToken(id);
        res.json({ accessToken });
      }
    );
  } catch (err) {
    res.status(500).json({ message: "Error refreshing token", error: err });
  }
};


// -------------------------
// LOGOUT
// -------------------------
export const logout = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;
  try {
    const user = (await User.findOne({ refreshToken: token })) as IUser | null;
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error logging out", error: err });
  }
};
