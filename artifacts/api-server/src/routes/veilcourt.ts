import { Router, type IRouter } from "express";
import { z } from "zod";

const router: IRouter = Router();

const MAX_MESSAGES = 200;
const MAX_DMS = 1500;
const MAX_NAME = 24;
const MAX_TEXT = 600;
const RATE_MS = 1500;
const PRESENCE_WINDOW_MS = 90 * 1000;

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
  mentions?: string[];
}

interface VeilDM extends VeilMessage {
  to: string;
}

interface VeilIdentity {
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
  lastSeen: number;
}

const messages: VeilMessage[] = [];
const dms: VeilDM[] = [];
let nextId = 1;
let nextDmId = 1;
const lastSendByPlayer = new Map<string, number>();
const lastSeenByPlayer = new Map<string, number>();
const playersById = new Map<string, VeilIdentity>();
const playerIdByName = new Map<string, string>(); // lowercased name → playerId

function pushMessage(m: Omit<VeilMessage, "id" | "ts">): VeilMessage {
  const full: VeilMessage = { ...m, id: nextId++, ts: Date.now() };
  messages.push(full);
  if (messages.length > MAX_MESSAGES) messages.splice(0, messages.length - MAX_MESSAGES);
  return full;
}

function pushDM(m: Omit<VeilDM, "id" | "ts">): VeilDM {
  const full: VeilDM = { ...m, id: nextDmId++, ts: Date.now() };
  dms.push(full);
  if (dms.length > MAX_DMS) dms.splice(0, dms.length - MAX_DMS);
  return full;
}

const IdentityShape = {
  playerId: z.string().min(4).max(64),
  name: z.string().min(1).max(MAX_NAME),
  classId: z.string().max(32).nullable().optional(),
  className: z.string().max(48).nullable().optional(),
  classColor: z.string().regex(/^#[0-9a-fA-F]{3,8}$/).nullable().optional(),
  sex: z.enum(["male", "female"]).nullable().optional(),
  portrait: z.string().max(800).nullable().optional(),
  rank: z.string().max(32).nullable().optional(),
  bloodmark: z.string().max(32).nullable().optional(),
  covenant: z.string().max(32).nullable().optional(),
};

const PostBody = z.object({ ...IdentityShape, text: z.string().min(1).max(MAX_TEXT) });
const PresenceBody = z.object(IdentityShape);
const DmBody = z.object({ ...IdentityShape, text: z.string().min(1).max(MAX_TEXT), to: z.string().min(4).max(64) });

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

function activeCount(now: number): number {
  let n = 0;
  for (const ts of lastSeenByPlayer.values()) if (now - ts < PRESENCE_WINDOW_MS) n++;
  return n;
}

function rememberIdentity(body: z.infer<typeof PresenceBody>, now: number) {
  const cleanName = sanitize(body.name).slice(0, MAX_NAME) || "Sorcerer";
  const id: VeilIdentity = {
    playerId: body.playerId,
    name: cleanName,
    classId: body.classId ?? null,
    className: body.className ?? null,
    classColor: body.classColor ?? null,
    sex: body.sex ?? null,
    portrait: safePortrait(body.portrait ?? null),
    rank: body.rank ?? null,
    bloodmark: body.bloodmark ?? null,
    covenant: body.covenant ?? null,
    lastSeen: now,
  };
  playersById.set(body.playerId, id);
  playerIdByName.set(cleanName.toLowerCase(), body.playerId);
  lastSeenByPlayer.set(body.playerId, now);
  if (playersById.size > 2000) {
    for (const [k, v] of playersById) if (now - v.lastSeen > PRESENCE_WINDOW_MS * 8) {
      playersById.delete(k);
      playerIdByName.delete(v.name.toLowerCase());
    }
  }
}

function extractMentions(text: string): string[] {
  const out = new Set<string>();
  const re = /@([A-Za-z0-9_\-' ]{1,24})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const raw = m[1];
    if (!raw) continue;
    // Try progressively shorter substrings to handle "@Aria" vs "@Aria the Bold"
    const words = raw.trim().split(/\s+/);
    for (let i = words.length; i >= 1; i--) {
      const guess = words.slice(0, i).join(" ").toLowerCase();
      const pid = playerIdByName.get(guess);
      if (pid) { out.add(pid); break; }
    }
  }
  return Array.from(out);
}

router.get("/veilcourt/messages", (req, res) => {
  const sinceRaw = req.query["since"];
  const since = typeof sinceRaw === "string" ? Number(sinceRaw) : 0;
  const cutoff = Number.isFinite(since) && since > 0 ? since : 0;
  const pidRaw = req.query["pid"];
  const now = Date.now();
  if (typeof pidRaw === "string" && pidRaw.length >= 4 && pidRaw.length <= 64) {
    lastSeenByPlayer.set(pidRaw, now);
    const known = playersById.get(pidRaw);
    if (known) known.lastSeen = now;
    if (lastSeenByPlayer.size > 1000) {
      for (const [k, v] of lastSeenByPlayer) if (now - v > PRESENCE_WINDOW_MS * 4) lastSeenByPlayer.delete(k);
    }
  }
  const out = messages.filter((m) => m.id > cutoff).slice(-100);
  res.set("Cache-Control", "no-store");
  res.json({ messages: out, latestId: messages.length > 0 ? messages[messages.length - 1]!.id : 0, online: activeCount(now) });
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
  rememberIdentity(body, now);
  if (lastSendByPlayer.size > 500) {
    const cutoff = now - 1000 * 60 * 30;
    for (const [k, v] of lastSendByPlayer) if (v < cutoff) lastSendByPlayer.delete(k);
  }
  const trimmedText = text.slice(0, MAX_TEXT);
  const mentions = extractMentions(trimmedText);
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
    text: trimmedText,
    channel: "global",
    mentions,
  });
  res.json({ message: msg });
});

// Presence heartbeat — refreshes identity + last-seen without producing a message
router.post("/veilcourt/presence", (req, res) => {
  const parsed = PresenceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid presence body" });
    return;
  }
  const now = Date.now();
  rememberIdentity(parsed.data, now);
  res.json({ ok: true, online: activeCount(now) });
});

// Roster — currently online sorcerers with full identity
router.get("/veilcourt/roster", (_req, res) => {
  const now = Date.now();
  const out: VeilIdentity[] = [];
  for (const id of playersById.values()) {
    if (now - id.lastSeen < PRESENCE_WINDOW_MS) out.push(id);
  }
  out.sort((a, b) => b.lastSeen - a.lastSeen);
  res.set("Cache-Control", "no-store");
  res.json({ players: out, online: out.length });
});

// Direct messages — fetch all DMs to/from a player
router.get("/veilcourt/dm", (req, res) => {
  const pid = req.query["pid"];
  if (typeof pid !== "string" || pid.length < 4 || pid.length > 64) {
    res.status(400).json({ error: "Missing pid" });
    return;
  }
  const sinceRaw = req.query["since"];
  const since = typeof sinceRaw === "string" ? Number(sinceRaw) : 0;
  const cutoff = Number.isFinite(since) && since > 0 ? since : 0;
  const now = Date.now();
  lastSeenByPlayer.set(pid, now);
  const known = playersById.get(pid);
  if (known) known.lastSeen = now;
  const out = dms.filter((m) => m.id > cutoff && (m.playerId === pid || m.to === pid)).slice(-200);
  res.set("Cache-Control", "no-store");
  res.json({ messages: out, latestId: dms.length > 0 ? dms[dms.length - 1]!.id : 0 });
});

router.post("/veilcourt/dm", (req, res) => {
  const parsed = DmBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid DM body" });
    return;
  }
  const body = parsed.data;
  const text = sanitize(body.text);
  if (!text) {
    res.status(400).json({ error: "Empty message" });
    return;
  }
  if (body.to === body.playerId) {
    res.status(400).json({ error: "You cannot DM yourself." });
    return;
  }
  if (!playersById.has(body.to)) {
    res.status(404).json({ error: "That sorcerer is not in the Veilcourt right now." });
    return;
  }
  const now = Date.now();
  const last = lastSendByPlayer.get(body.playerId) || 0;
  if (now - last < RATE_MS) {
    res.status(429).json({ error: "Slow down — the veil needs a breath between sendings.", retryMs: RATE_MS - (now - last) });
    return;
  }
  lastSendByPlayer.set(body.playerId, now);
  rememberIdentity(body, now);
  const dm = pushDM({
    playerId: body.playerId,
    to: body.to,
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
  res.json({ message: dm });
});

// Lookup a player by name (for "start a DM by typing their name")
router.get("/veilcourt/lookup", (req, res) => {
  const nameRaw = req.query["name"];
  if (typeof nameRaw !== "string") {
    res.status(400).json({ error: "Missing name" });
    return;
  }
  const pid = playerIdByName.get(nameRaw.trim().toLowerCase());
  if (!pid) {
    res.status(404).json({ error: "No sorcerer by that name in the Veilcourt." });
    return;
  }
  const id = playersById.get(pid);
  if (!id) {
    res.status(404).json({ error: "Identity expired." });
    return;
  }
  res.json({ player: id });
});

export default router;
