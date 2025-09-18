import mongoose, { Schema } from "mongoose";

const OrderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        contentId: { type: Schema.Types.ObjectId, ref: "Content" },
        kind: { type: String, enum: ["rent", "buy"], required: true },
        price: { type: Number, required: true },
      },
    ],
    total: { type: Number, required: true },
    status: { type: String, enum: ["pending", "paid"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);
