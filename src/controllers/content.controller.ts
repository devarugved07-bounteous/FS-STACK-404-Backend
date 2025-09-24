import { Response } from "express";
import { Types, SortOrder } from "mongoose";
import Content from "../models/Content";
import { AuthRequest } from "../middleware/auth";

// ------------------ GET ENDPOINTS ------------------

// Get all content
export const getAllContent = async (req: AuthRequest, res: Response) => {
  try {
    const contents = await Content.find();
    res.json(contents);
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ message: "Error fetching content", error: err.message });
    } else {
      res.status(500).json({ message: "Error fetching content" });
    }
  }
};

// Get content by category
export const getContentByCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.params;
    const contents = await Content.find({ category });
    res.json(contents);
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ message: "Error fetching content by category", error: err.message });
    } else {
      res.status(500).json({ message: "Error fetching content by category" });
    }
  }
};

// Get content by ID
export const getContentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const content = await Content.findById(id)
      .populate("comments.userId", "username")
      .populate("reviews.userId", "username");
    if (!content) return res.status(404).json({ message: "Content not found" });
    res.json(content);
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ message: "Error fetching content by ID", error: err.message });
    } else {
      res.status(500).json({ message: "Error fetching content by ID" });
    }
  }
};

// Search content by query
export const searchContent = async (req: AuthRequest, res: Response) => {
  try {
    const q = req.query.q;
    if (!q || typeof q !== "string")
      return res.status(400).json({ message: "Search query is required" });

    const results = await Content.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ],
    });

    res.json(results);
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ message: "Error searching content", error: err.message });
    } else {
      res.status(500).json({ message: "Error searching content" });
    }
  }
};

export const getSortedContent = async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.params;
    const { q, sort, order, page = "1", limit = "20" } = req.query;

    const filter: Record<string, unknown> = {};
    if (category && category !== "all") {
      filter.category = category;
    }
    if (q && typeof q === "string") {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    const sortField = sort && typeof sort === "string" ? sort : "createdAt";
    const sortOrder: SortOrder = order === "desc" ? -1 : 1;
    const sortObj: Record<string, SortOrder> = {};
    sortObj[sortField] = sortOrder;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.max(1, parseInt(limit as string, 10));
    const skip = (pageNum - 1) * limitNum;

    let query = Content.find(filter).sort(sortObj).skip(skip).limit(limitNum);

    if (sortField === "title") {
      query = query.collation({ locale: "en", strength: 2 });
    }

    const [items, total] = await Promise.all([query.exec(), Content.countDocuments(filter)]);
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      meta: { total, page: pageNum, limit: limitNum, totalPages },
      items,
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ message: "Error fetching sorted content", error: err.message });
    } else {
      res.status(500).json({ message: "Error fetching sorted content" });
    }
  }
};

// ------------------ USER INTERACTIONS ------------------

// Like content
export const likeContent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const content = await Content.findById(id);
    if (!content) return res.status(404).json({ message: "Content not found" });

    // Use toString to compare ObjectIds safely
    if (content.likes.some((likeId: Types.ObjectId) => likeId.toString() === userId.toString()))
      return res.status(400).json({ message: "Already liked" });

    content.likes.push(userId);
    await content.save();

    res.json({ message: "Content liked", likesCount: content.likes.length });
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ message: "Error liking content", error: err.message });
    } else {
      res.status(500).json({ message: "Error liking content" });
    }
  }
};

// Dislike content (remove like)
export const dislikeContent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const content = await Content.findById(id);
    if (!content) return res.status(404).json({ message: "Content not found" });

    const index = content.likes.findIndex(
      (likeId: Types.ObjectId) => likeId.toString() === userId.toString()
    );
    if (index === -1)
      return res.status(400).json({ message: "Content not liked yet" });

    content.likes.splice(index, 1);
    await content.save();

    res.json({ message: "Like removed", likesCount: content.likes.length });
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ message: "Error removing like", error: err.message });
    } else {
      res.status(500).json({ message: "Error removing like" });
    }
  }
};

// Add comment
export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user?._id;
    const username = req.user?.username;
    if (!userId || !username) return res.status(401).json({ message: "Unauthorized" });

    const content = await Content.findById(id);
    if (!content) return res.status(404).json({ message: "Content not found" });

    content.comments.push({ userId, text, createdAt: new Date() });
    await content.save();

    res.json({ message: "Comment added", comments: content.comments });
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ message: "Error adding comment", error: err.message });
    } else {
      res.status(500).json({ message: "Error adding comment" });
    }
  }
};

// Add review (movies only)
export const addReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const content = await Content.findById(id);
    if (!content) return res.status(404).json({ message: "Content not found" });

    if (content.category !== "movie")
      return res.status(400).json({ message: "Reviews only allowed for movies" });

    if (!content.reviews) content.reviews = [];
    content.reviews.push({ userId, text, createdAt: new Date() });
    await content.save();

    res.json({ message: "Review added", reviews: content.reviews });
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ message: "Error adding review", error: err.message });
    } else {
      res.status(500).json({ message: "Error adding review" });
    }
  }
};

// Get comments
export const getComments = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const content = await Content.findById(id).populate("comments.userId", "username");
    if (!content) return res.status(404).json({ message: "Content not found" });
    res.json({ comments: content.comments });
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ message: "Error fetching comments", error: err.message });
    } else {
      res.status(500).json({ message: "Error fetching comments" });
    }
  }
};

// Get reviews
export const getReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const content = await Content.findById(id).populate("reviews.userId", "username");
    if (!content) return res.status(404).json({ message: "Content not found" });
    if (content.category !== "movie")
      return res.status(400).json({ message: "No reviews for this content" });
    res.json({ reviews: content.reviews });
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ message: "Error fetching reviews", error: err.message });
    } else {
      res.status(500).json({ message: "Error fetching reviews" });
    }
  }
};
