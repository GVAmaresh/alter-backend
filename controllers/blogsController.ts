import { Request, Response } from "express";
import fs from "fs";
import path from "path";

export const getBlogs = async (req: Request, res: Response) => {
  try {
    const filePath = path.join(__dirname, "./blogs.json");

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading blogs.json:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      try {
        const blogs = JSON.parse(data);
        res.status(200).json({ message: "Blogs retrieved successfully", data: blogs });
      } catch (jsonError) {
        console.error("Error parsing blogs.json:", jsonError);
        res.status(500).json({ message: "Invalid JSON format in blogs.json" });
      }
    });

  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
