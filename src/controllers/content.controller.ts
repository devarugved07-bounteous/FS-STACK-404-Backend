import { Request, Response } from "express";
import Content from "../models/Content";

interface AuthRequest extends Request {
  user?: any;
}

// ------------------ GET ENDPOINTS ------------------

// Get all content
export const getAllContent = async (req: Request, res: Response) => {
  try {
    const contents = await Content.find();
    res.json(contents);
  } catch (err) {
    res.status(500).json({ message: "Error fetching content", error: err });
  }
};

// Get content by category
export const getContentByCategory = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const contents = await Content.find({ category });
    res.json(contents);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching content by category", error: err });
  }
};

// Get content by ID

export const getContentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const content = await Content.findById(id)
      .populate("comments.userId", "username")
      .populate("reviews.userId", "username");
    if (!content) return res.status(404).json({ message: "Content not found" });
    res.json(content);
  } catch (err) {
    res.status(500).json({ message: "Error fetching content by ID", error: err });
  }
};


// Search content by query
export const searchContent = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
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
  } catch (err) {
    res.status(500).json({ message: "Error searching content", error: err });
  }
};

export const getSortedContent = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const { q, sort, order, page = '1', limit = '20' } = req.query;

    const filter: any = {};
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (q && typeof q === 'string') {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    // Determine sort field and order
    const sortField = sort && typeof sort === 'string' ? sort : 'createdAt';

    // For alphabetical sorting, ensure collation for correct sorting
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj: any = {};
    sortObj[sortField] = sortOrder;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.max(1, parseInt(limit as string, 10));
    const skip = (pageNum - 1) * limitNum;

    // If sorting by title for alphabetical sort, use collation for proper letter-case sorting
    let query = Content.find(filter).sort(sortObj).skip(skip).limit(limitNum);
    if (sortField === 'title') {
      query = query.collation({ locale: 'en', strength: 2 }); // case-insensitive sorting
    }

    const [items, total] = await Promise.all([
      query.exec(),
      Content.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({ meta: { total, page: pageNum, limit: limitNum, totalPages }, items });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching sorted content', error: err });
  }
};

// ------------------ USER INTERACTIONS ------------------

// Like content
export const likeContent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const content = await Content.findById(id);
    if (!content) return res.status(404).json({ message: "Content not found" });

    if (content.likes.includes(userId))
      return res.status(400).json({ message: "Already liked" });

    content.likes.push(userId);
    await content.save();

    res.json({ message: "Content liked", likesCount: content.likes.length });
  } catch (err) {
    res.status(500).json({ message: "Error liking content", error: err });
  }
};

// Dislike content (remove like)
export const dislikeContent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const content = await Content.findById(id);
    if (!content) return res.status(404).json({ message: "Content not found" });

    const index = content.likes.indexOf(userId);
    if (index === -1)
      return res.status(400).json({ message: "Content not liked yet" });

    content.likes.splice(index, 1);
    await content.save();

    res.json({ message: "Like removed", likesCount: content.likes.length });
  } catch (err) {
    res.status(500).json({ message: "Error removing like", error: err });
  }
};

// Add comment
export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;
    const username = req.user.username;

    const content = await Content.findById(id);
    if (!content) return res.status(404).json({ message: "Content not found" });

    content.comments.push({ userId, text, createdAt: new Date() });
    await content.save();

    res.json({ message: "Comment added", comments: content.comments });
  } catch (err) {
    res.status(500).json({ message: "Error adding comment", error: err });
  }
};

// Add review (movies only)
export const addReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const content = await Content.findById(id);
    if (!content) return res.status(404).json({ message: "Content not found" });

    if (content.category !== "movie")
      return res.status(400).json({ message: "Reviews only allowed for movies" });

    if (!content.reviews) content.reviews = [];
    content.reviews.push({ userId, text, createdAt: new Date() });
    await content.save();

    res.json({ message: "Review added", reviews: content.reviews });
  } catch (err) {
    res.status(500).json({ message: "Error adding review", error: err });
  }
};

// Get comments
export const getComments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const content = await Content.findById(id).populate("comments.userId", "username");
    if (!content) return res.status(404).json({ message: "Content not found" });
    res.json({ comments: content.comments });
  } catch (err) {
    res.status(500).json({ message: "Error fetching comments", error: err });
  }
};

// Get reviews
export const getReviews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const content = await Content.findById(id).populate("reviews.userId", "username");
    if (!content) return res.status(404).json({ message: "Content not found" });
    if (content.category !== "movie")
      return res.status(400).json({ message: "No reviews for this content" });
    res.json({ reviews: content.reviews });
  } catch (err) {
    res.status(500).json({ message: "Error fetching reviews", error: err });
  }
};
