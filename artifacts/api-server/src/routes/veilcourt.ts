import { Router, type IRouter } from "express";
import { z } from "zod";

const router: IRouter = Router();

const MAX_MESSAGES = 200;
const MAX_NAME = 24;
const MAX_TEXT = 280;
const RATE_MS = 1500;

interface VeilMessage {
  id: number;
  ts: number;
  playerId: string;
  name: string;
  classId: string | null;
  className: string | null;
  classColor: string | null;
  sex: "male" | "female" | null;
  portrait: string | null;
  rank: string | null;
  bloodmark: string | null;
  covenant: string | null;
  text: string;
  channel: "global" | "system";
}

const messages: VeilMessage[] = [];
let nextId = 1;
const lastSendByPlayer = new Map<string, number>();

function pushMessage(m: Omit<VeilMessage, "id" | "ts">): VeilMessage {
  const full: VeilMessage = { ...m, id: nextId++, ts: Date.now() };
  messages.push(full);
  if (messages.length > MAX_MESSAGES) messages.splice(0, messages.length - MAX_MESSAGES);
  return full;
}

pushMessage({
  playerId: "system",
  name: "Veilcourt",
  classId: null,
  className: null,
  classColor: null,
  sex: null,
  portrait: null,
  rank: null,
  bloodmark: null,
  covenant: null,
  text: "The scrying basin stirs. Speak, sorcerer — your voice carries across the rift.",
  channel: "system",
});

const PostBody = z.object({
  playerId: z.string().min(4).max(64),
  name: z.string().min(1).max(MAX_NAME),
  text: z.string().min(1).max(MAX_TEXT),
  classId: z.string().max(32).nullable().optional(),
  className: z.string().max(48).nullable().optional(),
  classColor: z.string().regex(/^#[0-9a-fA-F]{3,8}$/).nullable().optional(),
  sex: z.enum(["male", "female"]).nullable().optional(),
  portrait: z.string().max(800).nullable().optional(),
  rank: z.string().max(32).nullable().optional(),
  bloodmark: z.string().max(32).nullable().optional(),
  covenant: z.string().max(32).nullable().optional(),
});

function sanitize(s: string): string {
  return s.replace(/[\u0000-\u001f\u007f]/g, "").trim();
}

function safePortrait(p: string | null | undefined): string | null {
  if (!p) return null;
  const v = p.trim();
  if (v.length > 800) return null;
  if (/^data:image\/svg/i.test(v)) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^data:image\/(png|jpe?g|gif|webp|avif|apng);base64,/i.test(v)) return v;
  return null;
}

router.get("/veilcourt/messages", (req, res) => {
  const sinceRaw = req.query["since"];
  const since = typeof sinceRaw === "string" ? Number(sinceRaw) : 0;
  const cutoff = Number.isFinite(since) && since > 0 ? since : 0;
  const out = messages.filter((m) => m.id > cutoff).slice(-100);
  res.json({ messages: out, latestId: messages.length > 0 ? messages[messages.length - 1]!.id : 0, online: lastSendByPlayer.size });
});

router.post("/veilcourt/messages", (req, res) => {
  const parsed = PostBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ err: parsed.error.message }, "veilcourt invalid body");
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const body = parsed.data;
  const text = sanitize(body.text);
  if (!text) {
    res.status(400).json({ error: "Empty message" });
    return;
  }
  const now = Date.now();
  const last = lastSendByPlayer.get(body.playerId) || 0;
  if (now - last < RATE_MS) {
    res.status(429).json({ error: "Slow down — the veil needs a breath between sendings.", retryMs: RATE_MS - (now - last) });
    return;
  }
  lastSendByPlayer.set(body.playerId, now);
  if (lastSendByPlayer.size > 500) {
    const cutoff = now - 1000 * 60 * 30;
    for (const [k, v] of lastSendByPlayer) if (v < cutoff) lastSendByPlayer.delete(k);
  }
  const msg = pushMessage({
    playerId: body.playerId,
    name: sanitize(body.name).slice(0, MAX_NAME) || "Unnamed",
    classId: body.classId ?? null,
    className: body.className ?? null,
    classColor: body.classColor ?? null,
    sex: body.sex ?? null,
    portrait: safePortrait(body.portrait ?? null),
    rank: body.rank ?? null,
    bloodmark: body.bloodmark ?? null,
    covenant: body.covenant ?? null,
    text: text.slice(0, MAX_TEXT),
    channel: "global",
  });
  res.json({ message: msg });
});

export default router;
