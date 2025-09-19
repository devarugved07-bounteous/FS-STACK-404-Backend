import { Request, Response } from "express";
import Content from "../models/Content";

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
    res.status(500).json({ message: "Error fetching content by category", error: err });
  }
};

// Get content by ID
export const getContentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const content = await Content.findById(id);
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
    if (!q || typeof q !== "string") {
      return res.status(400).json({ message: "Search query is required" });
    }

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
    const { category } = req.params; // movie | video | live | all
    const { q, sort, order, page = "1", limit = "20" } = req.query;

    // Filter
    const filter: any = {};
    if (category && category !== "all") {
      filter.category = category;
    }
    if (q && typeof q === "string" && q.trim().length > 0) {
      const regex = { $regex: q.trim(), $options: "i" };
      filter.$or = [{ title: regex }, { description: regex }];
    }

    // Sort
    const sortObj: any = {};
    if (sort && typeof sort === "string" && sort.trim().length > 0) {
      sortObj[sort] = order === "desc" ? -1 : 1;
    } else {
      sortObj["createdAt"] = -1; // default: newest first
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Content.find(filter).sort(sortObj).skip(skip).limit(limitNum),
      Content.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      meta: { total, page: pageNum, limit: limitNum, totalPages },
      items,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching sorted content", error: err });
  }
};