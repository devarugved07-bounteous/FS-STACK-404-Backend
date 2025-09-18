import { Request, Response } from "express";
import Content from "../models/Content";

export const getAllContent = async (req: Request, res: Response) => {
  const contents = await Content.find();
  res.json(contents);
};

export const getContentByCategory = async (req: Request, res: Response) => {
  const { category } = req.params;
  const contents = await Content.find({ category });
  res.json(contents);
};

export const getContentById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const content = await Content.findById(id);
  if (!content) return res.status(404).json({ message: "Content not found" });
  res.json(content);
};
