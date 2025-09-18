import mongoose, { Schema, Document } from "mongoose";

export interface IContent extends Document {
  title: string;
  description: string;
  category: "movie" | "live" | "video";
  price: number;
  url: string;
  thumbnail: string;
}

const contentSchema = new Schema<IContent>({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ["movie", "live", "video"], required: true },
  price: { type: Number, default: 0 },
  url: { type: String, required: true },
  thumbnail: { type: String, required: true },
});

const Content = mongoose.model<IContent>("Content", contentSchema);
export default Content;
