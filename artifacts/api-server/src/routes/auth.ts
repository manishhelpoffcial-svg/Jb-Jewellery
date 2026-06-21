import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { query } from "../lib/db.js";
import { signToken, authMiddleware, type JwtPayload } from "../lib/auth.js";
import { ADMIN_EMAIL } from "../lib/mailer.js";
import {
  sendWelcomeEmail,
  sendLoginAlertEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendAdminNewSignupEmail,
  shouldSendLoginAlert,
  markLoginAlertSent,
} from "../lib/mailer-templates.js";
import type { Request, Response } from "express";

const router = Router();

// Fire-and-forget helper so email failures never break the user-facing request.
function bg(p: Promise<unknown>, label: string) {
  p.catch((err) => {
    console.error(`[email:${label}]`, err instanceof Error ? err.message : err);
  });
}

function clientInfo(req: Request): { ip: string; userAgent: string } {
  const fwd = (req.headers["x-forwarded-for"] as string | undefined) || "";
  const ip = (fwd.split(",")[0] || req.socket.remoteAddress || "unknown").trim();
  const userAgent = (req.headers["user-agent"] as string | undefined) || "Unknown device";
  return { ip, userAgent };
}

function publicBase(): string {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, "");
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return "";
}

// In-memory password reset tokens (token → { userId, email, expiresAt }).
// Tokens are short-lived and always emailed — they don't need durable storage.
const _resetTokens = new Map<string, { userId: string; email: string; name: string; expiresAt: number }>();
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

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

    // Welcome customer + notify admin (fire-and-forget)
    bg(sendWelcomeEmail(email, name), "welcome");
    bg(
      sendAdminNewSignupEmail(ADMIN_EMAIL, {
        name,
        email,
        phone: phone || undefined,
        signupAt: new Date().toISOString(),
      }),
      "admin_new_signup",
    );
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

    // Login alert with 12h cooldown (fire-and-forget). Skip alerts to admin
    // accounts to avoid clutter; they sign in frequently.
    if (user.role !== "admin" && shouldSendLoginAlert(user.email)) {
      const { ip, userAgent } = clientInfo(req);
      markLoginAlertSent(user.email);
      bg(
        sendLoginAlertEmail(user.email, {
          name: user.name || user.email,
          ip,
          userAgent,
        }),
        "login_alert",
      );
    }
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
    const user = result.rows[0];

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) { res.status(400).json({ error: "Current password is incorrect" }); return; }

    const hash = await bcrypt.hash(newPassword, 10);
    await query("UPDATE jb_users SET password_hash=$1 WHERE id=$2", [hash, userId]);
    res.json({ success: true });

    // Notify the user that their password was just changed.
    const { ip } = clientInfo(req);
    bg(
      sendPasswordChangedEmail(user.email, {
        name: user.name || user.email,
        ip,
      }),
      "password_changed",
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// ── Forgot / Reset Password ─────────────────────────────────────────────────
// Always returns 200 to avoid leaking whether an email is registered.
router.post("/forgot-password", async (req: Request, res: Response) => {
  const { email } = (req.body || {}) as { email?: string };
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  // Always respond with success so we don't leak which emails are registered.
  res.json({ success: true });

  try {
    const result = await query(
      "SELECT id, name, email FROM jb_users WHERE email = $1",
      [email],
    );
    if (result.rows.length === 0) return;
    const user = result.rows[0];

    const token = crypto.randomBytes(32).toString("hex");
    _resetTokens.set(token, {
      userId: user.id,
      email: user.email,
      name: user.name || user.email,
      expiresAt: Date.now() + RESET_TOKEN_TTL_MS,
    });

    const resetUrl = `${publicBase()}/reset-password?token=${token}`;
    bg(
      sendPasswordResetEmail(user.email, {
        name: user.name || user.email,
        resetUrl,
        expiresInMinutes: 30,
      }),
      "password_reset",
    );
  } catch (err) {
    // Swallow — we already responded 200. Log so the admin can investigate.
    console.error("[forgot-password] lookup/send failed:", err instanceof Error ? err.message : err);
  }
});

router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body as { token?: string; newPassword?: string };
    if (!token || !newPassword) {
      res.status(400).json({ error: "Token and new password are required" });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const entry = _resetTokens.get(token);
    if (!entry || entry.expiresAt < Date.now()) {
      _resetTokens.delete(token);
      res.status(400).json({ error: "Invalid or expired reset link" });
      return;
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await query("UPDATE jb_users SET password_hash=$1 WHERE id=$2", [hash, entry.userId]);
    _resetTokens.delete(token);

    res.json({ success: true });

    const { ip } = clientInfo(req);
    bg(
      sendPasswordChangedEmail(entry.email, { name: entry.name, ip }),
      "password_changed_after_reset",
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not reset password" });
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
