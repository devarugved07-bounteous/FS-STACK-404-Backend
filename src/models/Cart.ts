import mongoose, { Schema, Document, Types } from "mongoose";
// import { ICartItem } from "./interfaces"; // optional: you can define ICartItem separately
export interface ICartItem extends Document {
  contentId: mongoose.Schema.Types.ObjectId;
  kind: "rent" | "buy";
  price: number;
}

// Cart item subdocument schema
const cartItemSchema = new Schema(
  {
    contentId: { type: Schema.Types.ObjectId, ref: "Content", required: true },
    kind: { type: String, enum: ["rent", "buy"], required: true },
    price: { type: Number, required: true },
  },
  { _id: true } // make sure _id exists
);

// Cart main schema
export interface ICart extends Document {
  userId: Types.ObjectId;
  items: Types.DocumentArray<any>; // DocumentArray of subdocuments
}

const cartSchema = new Schema<ICart>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  items: [cartItemSchema],
});

const Cart = mongoose.model<ICart>("Cart", cartSchema);
export default Cart;
