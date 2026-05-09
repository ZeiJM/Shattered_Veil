import { Router, type IRouter } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";

const router: IRouter = Router();

const MAX_MESSAGES = 200;
const MAX_THREAD_MESSAGES = 200;
const MAX_THREADS = 800;
const MAX_PARTICIPANTS = 8;
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

interface VeilThreadMessage extends VeilMessage {
  threadId: string;
}

interface VeilThread {
  id: string;
  participants: string[]; // playerIds
  createdAt: number;
  createdBy: string;
  messages: VeilThreadMessage[];
  nextMsgId: number;
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
const threads = new Map<string, VeilThread>();
let nextId = 1;
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
const ThreadCreateBody = z.object({
  ...IdentityShape,
  participantIds: z.array(z.string().min(4).max(64)).min(1).max(MAX_PARTICIPANTS),
});
const ThreadPostBody = z.object({ ...IdentityShape, text: z.string().min(1).max(MAX_TEXT) });
const ThreadLeaveBody = z.object({ playerId: z.string().min(4).max(64) });

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
    const words = raw.trim().split(/\s+/);
    for (let i = words.length; i >= 1; i--) {
      const guess = words.slice(0, i).join(" ").toLowerCase();
      const pid = playerIdByName.get(guess);
      if (pid) { out.add(pid); break; }
    }
  }
  return Array.from(out);
}

function participantsKey(ids: string[]): string {
  return Array.from(new Set(ids)).sort().join("|");
}

function findExistingThread(participantIds: string[]): VeilThread | null {
  const key = participantsKey(participantIds);
  for (const t of threads.values()) {
    if (participantsKey(t.participants) === key) return t;
  }
  return null;
}

function pruneOldestThreadIfNeeded() {
  if (threads.size <= MAX_THREADS) return;
  let oldest: VeilThread | null = null;
  for (const t of threads.values()) {
    const lastTs = t.messages.length > 0 ? t.messages[t.messages.length - 1]!.ts : t.createdAt;
    if (!oldest) { oldest = t; continue; }
    const oLast = oldest.messages.length > 0 ? oldest.messages[oldest.messages.length - 1]!.ts : oldest.createdAt;
    if (lastTs < oLast) oldest = t;
  }
  if (oldest) threads.delete(oldest.id);
}

function buildThreadView(t: VeilThread) {
  const participantIdentities: (VeilIdentity | { playerId: string; name: string; missing: true })[] =
    t.participants.map((pid) => {
      const ident = playersById.get(pid);
      if (ident) return ident;
      return { playerId: pid, name: "Unknown sorcerer", missing: true as const };
    });
  return {
    id: t.id,
    participants: participantIdentities,
    participantIds: t.participants,
    createdAt: t.createdAt,
    createdBy: t.createdBy,
    messages: t.messages,
  };
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
  if (!text) { res.status(400).json({ error: "Empty message" }); return; }
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

router.post("/veilcourt/presence", (req, res) => {
  const parsed = PresenceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid presence body" }); return; }
  const now = Date.now();
  rememberIdentity(parsed.data, now);
  res.json({ ok: true, online: activeCount(now) });
});

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

// ─── Threaded DMs (1-on-1 OR groups) ──────────────────────────────────
// GET all threads I'm a participant in (with their full message logs)
router.get("/veilcourt/dm", (req, res) => {
  const pid = req.query["pid"];
  if (typeof pid !== "string" || pid.length < 4 || pid.length > 64) {
    res.status(400).json({ error: "Missing pid" });
    return;
  }
  const now = Date.now();
  lastSeenByPlayer.set(pid, now);
  const known = playersById.get(pid);
  if (known) known.lastSeen = now;
  const out: ReturnType<typeof buildThreadView>[] = [];
  for (const t of threads.values()) {
    if (t.participants.includes(pid)) out.push(buildThreadView(t));
  }
  out.sort((a, b) => {
    const aLast = a.messages.length ? a.messages[a.messages.length - 1]!.ts : a.createdAt;
    const bLast = b.messages.length ? b.messages[b.messages.length - 1]!.ts : b.createdAt;
    return bLast - aLast;
  });
  res.set("Cache-Control", "no-store");
  res.json({ threads: out });
});

// Create (or reuse) a thread with a given participant set
router.post("/veilcourt/dm/thread", (req, res) => {
  const parsed = ThreadCreateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid thread body" }); return; }
  const body = parsed.data;
  const now = Date.now();
  rememberIdentity(body, now);
  const ids = Array.from(new Set([body.playerId, ...body.participantIds]));
  if (ids.length < 2) { res.status(400).json({ error: "A chat needs at least one other sorcerer." }); return; }
  if (ids.length > MAX_PARTICIPANTS) { res.status(400).json({ error: `Up to ${MAX_PARTICIPANTS} participants per chat.` }); return; }
  for (const pid of ids) {
    if (pid === body.playerId) continue;
    if (!playersById.has(pid)) {
      const ident = playersById.get(pid);
      const name = ident ? ident.name : pid;
      res.status(404).json({ error: `${name} is not in the Veilcourt right now.` });
      return;
    }
  }
  const existing = findExistingThread(ids);
  if (existing) { res.json({ thread: buildThreadView(existing), reused: true }); return; }
  const t: VeilThread = {
    id: randomUUID(),
    participants: ids,
    createdAt: now,
    createdBy: body.playerId,
    messages: [],
    nextMsgId: 1,
  };
  threads.set(t.id, t);
  pruneOldestThreadIfNeeded();
  res.json({ thread: buildThreadView(t), reused: false });
});

// Post a message into an existing thread
router.post("/veilcourt/dm/thread/:id/message", (req, res) => {
  const tid = req.params["id"];
  if (!tid) { res.status(400).json({ error: "Missing thread id" }); return; }
  const t = threads.get(tid);
  if (!t) { res.status(404).json({ error: "Chat no longer exists." }); return; }
  const parsed = ThreadPostBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid message body" }); return; }
  const body = parsed.data;
  if (!t.participants.includes(body.playerId)) {
    res.status(403).json({ error: "You are not in this chat." });
    return;
  }
  const text = sanitize(body.text);
  if (!text) { res.status(400).json({ error: "Empty message" }); return; }
  const now = Date.now();
  const last = lastSendByPlayer.get(body.playerId) || 0;
  if (now - last < RATE_MS) {
    res.status(429).json({ error: "Slow down — the veil needs a breath between sendings.", retryMs: RATE_MS - (now - last) });
    return;
  }
  lastSendByPlayer.set(body.playerId, now);
  rememberIdentity(body, now);
  const msg: VeilThreadMessage = {
    id: t.nextMsgId++,
    ts: now,
    threadId: t.id,
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
  };
  t.messages.push(msg);
  if (t.messages.length > MAX_THREAD_MESSAGES) {
    t.messages.splice(0, t.messages.length - MAX_THREAD_MESSAGES);
  }
  res.json({ message: msg });
});

// Leave a thread → deletes the entire log for everyone
router.post("/veilcourt/dm/thread/:id/leave", (req, res) => {
  const tid = req.params["id"];
  if (!tid) { res.status(400).json({ error: "Missing thread id" }); return; }
  const t = threads.get(tid);
  if (!t) { res.json({ ok: true, alreadyGone: true }); return; }
  const parsed = ThreadLeaveBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid leave body" }); return; }
  if (!t.participants.includes(parsed.data.playerId)) {
    res.status(403).json({ error: "You are not in this chat." });
    return;
  }
  threads.delete(tid);
  res.json({ ok: true, dissolved: true });
});

// Lookup a player by name (used by the typeahead when starting a new chat)
router.get("/veilcourt/lookup", (req, res) => {
  const nameRaw = req.query["name"];
  if (typeof nameRaw !== "string") { res.status(400).json({ error: "Missing name" }); return; }
  const pid = playerIdByName.get(nameRaw.trim().toLowerCase());
  if (!pid) { res.status(404).json({ error: "No sorcerer by that name in the Veilcourt." }); return; }
  const id = playersById.get(pid);
  if (!id) { res.status(404).json({ error: "Identity expired." }); return; }
  res.json({ player: id });
});

export default router;
