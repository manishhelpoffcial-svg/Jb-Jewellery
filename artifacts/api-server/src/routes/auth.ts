import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { query } from "../lib/db.js";
import { signToken, authMiddleware, type JwtPayload } from "../lib/auth.js";
import type { Request, Response } from "express";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email and password are required" });
      return;
    }

    const existing = await query("SELECT id FROM jb_users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await query(
      "INSERT INTO jb_users (id, name, email, phone, password_hash, role) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, name, email, phone || "", hash, "user"]
    );

    const payload: JwtPayload = { userId: id, email, role: "user" };
    const token = signToken(payload);
    res.json({ token, user: { id, name, email, phone: phone || "", role: "user" } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const result = await query("SELECT * FROM jb_users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    if (user.is_active === false) {
      res.status(403).json({ error: "Your account has been suspended. Please contact us for assistance." });
      return;
    }

    const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
    const token = signToken(payload);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.created_at },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.patch("/profile", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as Request & { user: JwtPayload }).user;
    const { name, phone } = req.body;
    const result = await query(
      "UPDATE jb_users SET name=$1, phone=$2 WHERE id=$3 RETURNING id,name,email,phone,role",
      [name, phone, userId]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.patch("/password", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as Request & { user: JwtPayload }).user;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) { res.status(400).json({ error: "Both passwords required" }); return; }
    if (newPassword.length < 8) { res.status(400).json({ error: "Password must be at least 8 characters" }); return; }

    const result = await query("SELECT * FROM jb_users WHERE id=$1", [userId]);
    if (result.rows.length === 0) { res.status(404).json({ error: "User not found" }); return; }

    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) { res.status(400).json({ error: "Current password is incorrect" }); return; }

    const hash = await bcrypt.hash(newPassword, 10);
    await query("UPDATE jb_users SET password_hash=$1 WHERE id=$2", [hash, userId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as Request & { user: JwtPayload }).user;
    const result = await query("SELECT id, name, email, phone, role, created_at FROM jb_users WHERE id = $1", [userId]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const u = result.rows[0];
    res.json({ user: { id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, createdAt: u.created_at } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
