import { Router } from "express";
import { query } from "../lib/db.js";
import { authMiddleware, type JwtPayload } from "../lib/auth.js";
import type { Request, Response } from "express";

const router = Router();

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  const user = (req as Request & { user: JwtPayload }).user;
  const result = await query(
    "SELECT * FROM jb_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC",
    [user.userId]
  );
  res.json({ addresses: result.rows });
});

router.post("/", authMiddleware, async (req: Request, res: Response) => {
  const user = (req as Request & { user: JwtPayload }).user;
  const { label, fullName, phone, line1, line2, city, state, pincode, isDefault } = req.body;

  const count = await query("SELECT COUNT(*) FROM jb_addresses WHERE user_id = $1", [user.userId]);
  if (parseInt(count.rows[0].count) >= 5) {
    res.status(400).json({ error: "Maximum 5 addresses allowed" });
    return;
  }

  if (isDefault) {
    await query("UPDATE jb_addresses SET is_default = FALSE WHERE user_id = $1", [user.userId]);
  }

  const result = await query(
    `INSERT INTO jb_addresses (user_id, label, full_name, phone, line1, line2, city, state, pincode, is_default)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [user.userId, label || "Home", fullName, phone, line1, line2 || "", city, state, pincode, !!isDefault]
  );
  res.status(201).json({ address: result.rows[0] });
});

router.put("/:id", authMiddleware, async (req: Request, res: Response) => {
  const user = (req as Request & { user: JwtPayload }).user;
  const { id } = req.params;
  const { label, fullName, phone, line1, line2, city, state, pincode, isDefault } = req.body;

  if (isDefault) {
    await query("UPDATE jb_addresses SET is_default = FALSE WHERE user_id = $1", [user.userId]);
  }

  const result = await query(
    `UPDATE jb_addresses SET label=$1, full_name=$2, phone=$3, line1=$4, line2=$5, city=$6, state=$7, pincode=$8, is_default=$9
     WHERE id=$10 AND user_id=$11 RETURNING *`,
    [label, fullName, phone, line1, line2 || "", city, state, pincode, !!isDefault, id, user.userId]
  );
  if (result.rows.length === 0) { res.status(404).json({ error: "Address not found" }); return; }
  res.json({ address: result.rows[0] });
});

router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  const user = (req as Request & { user: JwtPayload }).user;
  await query("DELETE FROM jb_addresses WHERE id = $1 AND user_id = $2", [req.params.id, user.userId]);
  res.json({ success: true });
});

router.patch("/:id/default", authMiddleware, async (req: Request, res: Response) => {
  const user = (req as Request & { user: JwtPayload }).user;
  await query("UPDATE jb_addresses SET is_default = FALSE WHERE user_id = $1", [user.userId]);
  await query("UPDATE jb_addresses SET is_default = TRUE WHERE id = $1 AND user_id = $2", [req.params.id, user.userId]);
  res.json({ success: true });
});

export default router;
