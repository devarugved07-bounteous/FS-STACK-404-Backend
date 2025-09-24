import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICartItem extends Document {
  _id: Types.ObjectId;          // Add this line explicitly
  contentId: Types.ObjectId;
  kind: "rent" | "buy";
  price: number;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    contentId: { type: Schema.Types.ObjectId, ref: "Content", required: true },
    kind: { type: String, enum: ["rent", "buy"], required: true },
    price: { type: Number, required: true },
  },
  { _id: true }
);

export interface ICart extends Document {
  userId: Types.ObjectId;
  items: Types.DocumentArray<ICartItem>;
}

const cartSchema = new Schema<ICart>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  items: [cartItemSchema],
});

const Cart = mongoose.model<ICart>("Cart", cartSchema);
export default Cart;
