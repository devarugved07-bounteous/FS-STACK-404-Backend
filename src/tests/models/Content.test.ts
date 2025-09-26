import Content, { IContent } from "../../models/Content";
import mongoose from "mongoose";

describe("Content Model", () => {
  let content: IContent;

  beforeEach(() => {
    content = new Content({
      title: "Test Content",
      description: "Test Description",
      category: "movie",
      price: 10.99,
      url: "https://example.com/video",
      thumbnail: "https://example.com/thumbnail.jpg",
      likes: [],
      comments: [],
      reviews: [],
    });
  });

  it("should have required fields", () => {
    expect(content.title).toBe("Test Content");
    expect(content.category).toBe("movie");
    expect(content.price).toBe(10.99);
  });

  it("should add a comment", () => {
    const comment = {
      userId: new mongoose.Types.ObjectId(),
      text: "Great content!",
      createdAt: new Date(),
    };
    content.comments.push(comment);
    expect(content.comments).toHaveLength(1);
    expect(content.comments[0].text).toBe("Great content!");
  });

  it("should add a review", () => {
    const review = {
      userId: new mongoose.Types.ObjectId(),
      text: "Excellent movie!",
      createdAt: new Date(),
    };
    if (!content.reviews) content.reviews = [];
    content.reviews.push(review);
    expect(content.reviews).toHaveLength(1);
    expect(content.reviews[0].text).toBe("Excellent movie!");
  });

  it("should add a like", () => {
    const userId = new mongoose.Types.ObjectId();
    content.likes.push(userId);
    expect(content.likes).toContain(userId);
  });
});
