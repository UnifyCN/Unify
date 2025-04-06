import express from "express";
import pool from "../database/POSTGRESdb";

const router = express.Router();

router.post("/", async (req, res) => {
  const { user_id, content } = req.body;
  try {
    const newPost = await pool.query(
      "INSERT INTO posts (user_id, content) VALUES ($1, $2) RETURNING *",
      [user_id, content]
    );
    res.json(newPost.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;