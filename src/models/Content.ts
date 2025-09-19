import mongoose, { Schema, Document } from "mongoose";

export interface IComment {
  userId: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
}

export interface IContent extends Document {
  title: string;
  description: string;
  category: string; // movie, video, live
  price: number;
  url: string;
  thumbnail: string;
  likes: mongoose.Types.ObjectId[]; // users who liked
  comments: IComment[]; // comments for all categories
  reviews?: IComment[]; // only for movies
}

const CommentSchema = new Schema<IComment>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ContentSchema = new Schema<IContent>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  url: { type: String, required: true },
  thumbnail: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [CommentSchema],
  reviews: [CommentSchema], // only for movies
});

export default mongoose.model<IContent>("Content", ContentSchema);
