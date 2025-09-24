import mongoose, { Document, Schema } from "mongoose";

interface IOrderItem {
  name: string;
  price: number;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  paymentIntentId?: string;
  amount_total?: number;
  currency?: string;
  status?: string;
  createdAt?: Date;
}

const orderSchema = new Schema<IOrder>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
    },
  ],
  paymentIntentId: String,
  amount_total: Number,
  currency: String,
  status: String,
  createdAt: { type: Date, default: Date.now },
});

export const Order = mongoose.model<IOrder>("Order", orderSchema);
