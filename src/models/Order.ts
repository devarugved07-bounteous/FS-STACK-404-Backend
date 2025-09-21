import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{ type: Object, required: true }],
  paymentIntentId: String,
  amount_total: Number,
  currency: String,
  status: String,
  createdAt: { type: Date, default: Date.now },
});

export const Order = mongoose.model('Order', orderSchema);
