import mongoose, { Document, Schema, Types } from "mongoose";
import bcrypt from "bcrypt";

// Define the user interface
export interface IUser extends Document {
  _id: Types.ObjectId; // explicitly declare _id
  username: string;
  password: string;
  dob?: Date;
  address?: string;
  watchlist: Types.ObjectId[];
  refreshToken?: string;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

// Create the schema
const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    dob: { type: Date },
    address: { type: String },
    watchlist: [{ type: Schema.Types.ObjectId, ref: "Content", default: [] }],
    refreshToken: { type: String },
  },
  { timestamps: true }
);

// Pre-save hook to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Password comparison method
userSchema.methods.matchPassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export model
const User = mongoose.model<IUser>("User", userSchema);
export default User;
