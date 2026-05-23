import { Router } from "express";
import { query } from "../lib/db.js";
import { authMiddleware, adminMiddleware, type JwtPayload } from "../lib/auth.js";
import type { Request, Response } from "express";

const router = Router();

router.get("/my", authMiddleware, async (req: Request, res: Response) => {
  const user = (req as Request & { user: JwtPayload }).user;
  const result = await query(
    "SELECT * FROM jb_reviews WHERE user_id = $1 ORDER BY created_at DESC",
    [user.userId]
  );
  res.json({ reviews: result.rows });
});

router.post("/", authMiddleware, async (req: Request, res: Response) => {
  const user = (req as Request & { user: JwtPayload }).user;
  const { productId, productName, rating, reviewText } = req.body;
  if (!productId || !rating) { res.status(400).json({ error: "Product and rating required" }); return; }

  const result = await query(
    `INSERT INTO jb_reviews (user_id, product_id, product_name, rating, review_text)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (user_id, product_id) DO UPDATE SET rating=$4, review_text=$5, updated_at=NOW()
     RETURNING *`,
    [user.userId, productId, productName, rating, reviewText || ""]
  );
  res.status(201).json({ review: result.rows[0] });
});

router.put("/:id", authMiddleware, async (req: Request, res: Response) => {
  const user = (req as Request & { user: JwtPayload }).user;
  const { rating, reviewText } = req.body;
  const result = await query(
    "UPDATE jb_reviews SET rating=$1, review_text=$2, updated_at=NOW() WHERE id=$3 AND user_id=$4 RETURNING *",
    [rating, reviewText || "", req.params.id, user.userId]
  );
  if (result.rows.length === 0) { res.status(404).json({ error: "Review not found" }); return; }
  res.json({ review: result.rows[0] });
});

router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  const user = (req as Request & { user: JwtPayload }).user;
  await query("DELETE FROM jb_reviews WHERE id=$1 AND user_id=$2", [req.params.id, user.userId]);
  res.json({ success: true });
});

router.get("/product/:productId", async (req: Request, res: Response) => {
  const result = await query(
    `SELECT r.*, u.name as reviewer_name FROM jb_reviews r
     JOIN jb_users u ON u.id = r.user_id
     WHERE r.product_id=$1 ORDER BY r.created_at DESC`,
    [req.params.productId]
  );
  res.json({ reviews: result.rows });
});

export default router;
