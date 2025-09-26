import request from "supertest";
import express from "express";
import contentRouter from "../../routes/content.routes";
import Content from "../../models/Content";

// Mock the Content model
jest.mock("../../models/Content");

// Mock the auth middleware
jest.mock("../../middleware/auth", () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: "userId123", username: "testuser" };
    next();
  }),
}));

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use("/api/content", contentRouter);

describe("Content Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------
  // GET ALL CONTENT
  // -----------------------------
  it("should get all content successfully", async () => {
    (Content.find as jest.Mock).mockResolvedValue([
      { _id: "1", title: "Test Content", category: "movie" },
    ]);

    const res = await request(app).get("/api/content/");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      { _id: "1", title: "Test Content", category: "movie" },
    ]);
  });

  it("should handle error in getAllContent", async () => {
    (Content.find as jest.Mock).mockRejectedValue(new Error("DB Error"));

    const res = await request(app).get("/api/content/");

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Error fetching content");
  });

  // -----------------------------
  // GET CONTENT BY CATEGORY
  // -----------------------------
  it("should get content by category successfully", async () => {
    (Content.find as jest.Mock).mockResolvedValue([
      { _id: "1", title: "Test Movie", category: "movie" },
    ]);

    const res = await request(app).get("/api/content/category/movie");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      { _id: "1", title: "Test Movie", category: "movie" },
    ]);
  });

  it("should handle error in getContentByCategory", async () => {
    (Content.find as jest.Mock).mockRejectedValue(new Error("DB Error"));

    const res = await request(app).get("/api/content/category/movie");

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Error fetching content by category");
  });

  // -----------------------------
  // GET CONTENT BY ID
  // -----------------------------
  it("should get content by ID successfully", async () => {
    const mockContent = {
      _id: "1",
      title: "Test Content",
      comments: [],
      reviews: [],
    };
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => resolve(mockContent)),
      catch: jest.fn(),
    };
    (Content.findById as jest.Mock).mockReturnValue(mockQuery);

    const res = await request(app).get("/api/content/1");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockContent);
  });

  it("should return 404 if content not found", async () => {
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => resolve(null)),
      catch: jest.fn(),
    };
    (Content.findById as jest.Mock).mockReturnValue(mockQuery);

    const res = await request(app).get("/api/content/1");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Content not found");
  });

  it("should handle error in getContentById", async () => {
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      then: jest.fn(() => { throw new Error("DB Error"); }),
      catch: jest.fn(),
    };
    (Content.findById as jest.Mock).mockReturnValue(mockQuery);

    const res = await request(app).get("/api/content/1");

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Error fetching content by ID");
  });

  // -----------------------------
  // SEARCH CONTENT
  // -----------------------------
  it("should search content successfully", async () => {
    (Content.find as jest.Mock).mockResolvedValue([
      { _id: "1", title: "Test Search", description: "desc" },
    ]);

    const res = await request(app).get("/api/content/search?q=test");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      { _id: "1", title: "Test Search", description: "desc" },
    ]);
  });

  it("should return 400 if no query", async () => {
    const res = await request(app).get("/api/content/search");

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Search query is required");
  });

  it("should handle error in searchContent", async () => {
    (Content.find as jest.Mock).mockRejectedValue(new Error("DB Error"));

    const res = await request(app).get("/api/content/search?q=test");

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Error searching content");
  });

  // -----------------------------
  // GET SORTED CONTENT
  // -----------------------------
  it("should get sorted content successfully", async () => {
    const mockQuery = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      collation: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([{ _id: "1", title: "Test" }]),
    };
    (Content.find as jest.Mock).mockReturnValue(mockQuery);
    (Content.countDocuments as jest.Mock).mockResolvedValue(1);

    const res = await request(app).get("/api/content/sort/all");

    expect(res.statusCode).toBe(200);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.items).toEqual([{ _id: "1", title: "Test" }]);
  });

  it("should handle error in getSortedContent", async () => {
    (Content.find as jest.Mock).mockImplementation(() => {
      throw new Error("DB Error");
    });

    const res = await request(app).get("/api/content/sort/all");

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Error fetching sorted content");
  });

  // -----------------------------
  // LIKE CONTENT
  // -----------------------------
  it("should like content successfully", async () => {
    const mockContent = {
      _id: "1",
      likes: [],
      save: jest.fn().mockResolvedValue(true),
    };
    (Content.findById as jest.Mock).mockResolvedValue(mockContent);

    const res = await request(app).post("/api/content/1/like");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Content liked");
    expect(mockContent.likes).toContain("userId123");
  });

  it("should return 404 if content not found for like", async () => {
    (Content.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).post("/api/content/1/like");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Content not found");
  });

  it("should return 400 if already liked", async () => {
    const mockContent = {
      _id: "1",
      likes: ["userId123"],
      save: jest.fn(),
    };
    (Content.findById as jest.Mock).mockResolvedValue(mockContent);

    const res = await request(app).post("/api/content/1/like");

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Already liked");
  });

  it("should handle error in likeContent", async () => {
    (Content.findById as jest.Mock).mockRejectedValue(new Error("DB Error"));

    const res = await request(app).post("/api/content/1/like");

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Error liking content");
  });

  // -----------------------------
  // DISLIKE CONTENT
  // -----------------------------
  it("should dislike content successfully", async () => {
    const mockContent = {
      _id: "1",
      likes: ["userId123"],
      save: jest.fn().mockResolvedValue(true),
    };
    (Content.findById as jest.Mock).mockResolvedValue(mockContent);

    const res = await request(app).delete("/api/content/1/like");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Like removed");
    expect(mockContent.likes).not.toContain("userId123");
  });

  it("should return 400 if not liked yet", async () => {
    const mockContent = {
      _id: "1",
      likes: [],
      save: jest.fn(),
    };
    (Content.findById as jest.Mock).mockResolvedValue(mockContent);

    const res = await request(app).delete("/api/content/1/like");

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Content not liked yet");
  });

  // -----------------------------
  // ADD COMMENT
  // -----------------------------
  it("should add comment successfully", async () => {
    const mockContent = {
      _id: "1",
      comments: [],
      save: jest.fn().mockResolvedValue(true),
    };
    (Content.findById as jest.Mock).mockResolvedValue(mockContent);

    const res = await request(app)
      .post("/api/content/1/comment")
      .send({ text: "Great content!" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Comment added");
    expect(mockContent.comments).toHaveLength(1);
  });

  it("should return 404 if content not found for comment", async () => {
    (Content.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post("/api/content/1/comment")
      .send({ text: "Comment" });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Content not found");
  });

  // -----------------------------
  // ADD REVIEW
  // -----------------------------
  it("should add review successfully for movie", async () => {
    const mockContent = {
      _id: "1",
      category: "movie",
      reviews: [],
      save: jest.fn().mockResolvedValue(true),
    };
    (Content.findById as jest.Mock).mockResolvedValue(mockContent);

    const res = await request(app)
      .post("/api/content/1/review")
      .send({ text: "Great movie!" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Review added");
    expect(mockContent.reviews).toHaveLength(1);
  });

  it("should return 400 if not a movie", async () => {
    const mockContent = {
      _id: "1",
      category: "tv",
      reviews: [],
    };
    (Content.findById as jest.Mock).mockResolvedValue(mockContent);

    const res = await request(app)
      .post("/api/content/1/review")
      .send({ text: "Review" });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Reviews only allowed for movies");
  });

  // -----------------------------
  // GET COMMENTS
  // -----------------------------
  it("should get comments successfully", async () => {
    const mockContent = {
      _id: "1",
      comments: [{ userId: "userId", text: "Comment" }],
    };
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => resolve(mockContent)),
      catch: jest.fn(),
    };
    (Content.findById as jest.Mock).mockReturnValue(mockQuery);

    const res = await request(app).get("/api/content/1/comments");

    expect(res.statusCode).toBe(200);
    expect(res.body.comments).toEqual(mockContent.comments);
  });

  // -----------------------------
  // GET REVIEWS
  // -----------------------------
  it("should get reviews successfully for movie", async () => {
    const mockContent = {
      _id: "1",
      category: "movie",
      reviews: [{ userId: "userId", text: "Review" }],
    };
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => resolve(mockContent)),
      catch: jest.fn(),
    };
    (Content.findById as jest.Mock).mockReturnValue(mockQuery);

    const res = await request(app).get("/api/content/1/reviews");

    expect(res.statusCode).toBe(200);
    expect(res.body.reviews).toEqual(mockContent.reviews);
  });

  it("should return 400 if not a movie for reviews", async () => {
    const mockContent = {
      _id: "1",
      category: "tv",
      reviews: [],
    };
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => resolve(mockContent)),
      catch: jest.fn(),
    };
    (Content.findById as jest.Mock).mockReturnValue(mockQuery);

    const res = await request(app).get("/api/content/1/reviews");

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("No reviews for this content");
  });
});
