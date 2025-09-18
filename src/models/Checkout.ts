import mongoose, { Schema, Document } from "mongoose";

interface ICheckoutItem {
  contentId: mongoose.Types.ObjectId;
  kind: "rent" | "buy";
  price: number;
}

export interface ICheckout extends Document {
  userId: mongoose.Types.ObjectId;
  items: ICheckoutItem[];
  total: number;
  createdAt: Date;
}

const checkoutItemSchema = new Schema<ICheckoutItem>({
  contentId: { type: Schema.Types.ObjectId, ref: "Content", required: true },
  kind: { type: String, enum: ["rent", "buy"], required: true },
  price: { type: Number, required: true },
});

const checkoutSchema = new Schema<ICheckout>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  items: [checkoutItemSchema],
  total: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Checkout = mongoose.model<ICheckout>("Checkout", checkoutSchema);
export default Checkout;
