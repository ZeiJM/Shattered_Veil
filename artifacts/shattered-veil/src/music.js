// Shattered Veil — chiptune-style music engine (v41)
// SNES-JRPG flavored procedural music via Web Audio API.
// No assets, no licensing, no network. ~4 looping tracks driven by `scr`.

const NOTE = {
  "C2":65.41,"D2":73.42,"E2":82.41,"F2":87.31,"G2":98.00,"A2":110.00,"B2":123.47,
  "C3":130.81,"Cs3":138.59,"D3":146.83,"Ds3":155.56,"E3":164.81,"F3":174.61,"Fs3":185.00,
  "G3":196.00,"Gs3":207.65,"A3":220.00,"As3":233.08,"B3":246.94,
  "C4":261.63,"Cs4":277.18,"D4":293.66,"Ds4":311.13,"E4":329.63,"F4":349.23,"Fs4":369.99,
  "G4":392.00,"Gs4":415.30,"A4":440.00,"As4":466.16,"B4":493.88,
  "C5":523.25,"Cs5":554.37,"D5":587.33,"Ds5":622.25,"E5":659.25,"F5":698.46,"Fs5":739.99,
  "G5":783.99,"Gs5":830.61,"A5":880.00,"As5":932.33,"B5":987.77,"C6":1046.50,
};

// Pattern entry: ["NoteOrNull", beats, optionalGainScale]
// Each instrument list runs sequentially through one loop's worth of beats.
// Bars × 4 beats must equal the sum of beats in each instrument pattern.
function rep(pattern, n) { const out = []; for (let i = 0; i < n; i++) for (const e of pattern) out.push(e); return out; }

// ───── TITLE: slow, mysterious, contemplative (Am - F - G - Em) ─────
const TITLE = {
  bpm: 70, bars: 8,
  instruments: [
    { type: "triangle", gain: 0.18, detune: 0, pattern: [
      // Am 2bars
      ["A4",1.5],["C5",0.5],["E5",2],["C5",2],["B4",2],
      // F 2bars
      ["A4",1.5],["F4",0.5],["C5",2],["F5",2],["E5",2],
      // G 2bars
      ["D5",1.5],["B4",0.5],["G4",2],["B4",2],["D5",2],
      // Em 2bars
      ["E4",1],["G4",1],["B4",2],["E5",2],["B4",2],
    ]},
    { type: "sine", gain: 0.10, detune: 7, pattern: [
      ["E4",4],["C4",4],
      ["C4",4],["A3",4],
      ["B3",4],["G3",4],
      ["G3",4],["E3",4],
    ]},
    { type: "triangle", gain: 0.22, detune: 0, pattern: [
      // Bass: tonic / fifth alternation
      ["A2",2],["E3",2],["A2",2],["E3",2],
      ["F2",2],["C3",2],["F2",2],["C3",2],
      ["G2",2],["D3",2],["G2",2],["D3",2],
      ["E2",2],["B2",2],["E2",2],["B2",2],
    ]},
  ],
};

// ───── TRAVEL: bright, hopeful, motion (C - G - Am - F) ─────
const TRAVEL = {
  bpm: 116, bars: 8,
  instruments: [
    { type: "square", gain: 0.13, detune: 0, pattern: [
      // C 2bars - melody
      ["C5",0.5],["E5",0.5],["G5",0.5],["E5",0.5],["C5",0.5],["G4",0.5],["E5",0.5],["G5",0.5],
      ["A5",1],["G5",0.5],["E5",0.5],["G5",1],["E5",1],
      // G 2bars
      ["B4",0.5],["D5",0.5],["G5",0.5],["D5",0.5],["B4",0.5],["G4",0.5],["D5",0.5],["G5",0.5],
      ["F5",1],["D5",0.5],["B4",0.5],["D5",1],["B4",1],
      // Am 2bars
      ["A4",0.5],["C5",0.5],["E5",0.5],["C5",0.5],["A4",0.5],["E4",0.5],["C5",0.5],["E5",0.5],
      ["F5",1],["E5",0.5],["C5",0.5],["E5",1],["C5",1],
      // F 2bars
      ["F4",0.5],["A4",0.5],["C5",0.5],["A4",0.5],["F4",0.5],["C4",0.5],["A4",0.5],["C5",0.5],
      ["D5",1],["C5",0.5],["A4",0.5],["F4",2],
    ]},
    { type: "sine", gain: 0.08, detune: 5, pattern: [
      // Pad harmony: chord 3rd/5th holds
      ["E4",4],["G4",4],
      ["D4",4],["G4",4],
      ["C4",4],["E4",4],
      ["A3",4],["C4",4],
    ]},
    { type: "triangle", gain: 0.24, detune: 0, pattern: [
      // Walking bass: root - fifth - root - third
      ["C3",1],["G2",1],["C3",1],["E3",1],
      ["C3",1],["G2",1],["C3",1],["E3",1],
      ["G2",1],["D3",1],["G2",1],["B2",1],
      ["G2",1],["D3",1],["G2",1],["B2",1],
      ["A2",1],["E3",1],["A2",1],["C3",1],
      ["A2",1],["E3",1],["A2",1],["C3",1],
      ["F2",1],["C3",1],["F2",1],["A2",1],
      ["F2",1],["C3",1],["F2",1],["A2",1],
    ]},
  ],
};

// ───── BATTLE: driving, tense (Em - C - D - B7) ─────
const BATTLE = {
  bpm: 144, bars: 8,
  instruments: [
    { type: "square", gain: 0.14, detune: 0, pattern: [
      // Em 2bars - punchy 8ths
      ["E5",0.5],["E5",0.5],["G5",0.5],["B5",0.5],["A5",0.5],["G5",0.5],["E5",0.5],["D5",0.5],
      ["E5",1],["B4",1],["E5",1],["G5",1],
      // C 2bars
      ["C5",0.5],["C5",0.5],["E5",0.5],["G5",0.5],["A5",0.5],["G5",0.5],["E5",0.5],["C5",0.5],
      ["E5",1],["G5",1],["C5",1],["E5",1],
      // D 2bars
      ["D5",0.5],["D5",0.5],["Fs5",0.5],["A5",0.5],["B5",0.5],["A5",0.5],["Fs5",0.5],["D5",0.5],
      ["D5",1],["A4",1],["D5",1],["Fs5",1],
      // B7 2bars
      ["B4",0.5],["Ds5",0.5],["Fs5",0.5],["A5",0.5],["B5",0.5],["A5",0.5],["Fs5",0.5],["Ds5",0.5],
      ["B4",2],["Fs5",2],
    ]},
    { type: "sawtooth", gain: 0.06, detune: -7, pattern: [
      // Counter-melody / harmony
      ["B4",2],["E4",2],["B4",2],["E5",2],
      ["G4",2],["C4",2],["G4",2],["E5",2],
      ["A4",2],["D4",2],["A4",2],["Fs5",2],
      ["Fs4",2],["B3",2],["Fs4",2],["Ds5",2],
    ]},
    { type: "triangle", gain: 0.30, detune: 0, pattern: rep([
      // Pulsing 8th-note bass
      ["E2",0.5],["E2",0.5],["E3",0.5],["E2",0.5],["B2",0.5],["E2",0.5],["E3",0.5],["B2",0.5],
    ], 2).concat(rep([
      ["C2",0.5],["C2",0.5],["C3",0.5],["C2",0.5],["G2",0.5],["C2",0.5],["C3",0.5],["G2",0.5],
    ], 2)).concat(rep([
      ["D2",0.5],["D2",0.5],["D3",0.5],["D2",0.5],["A2",0.5],["D2",0.5],["D3",0.5],["A2",0.5],
    ], 2)).concat(rep([
      ["B2",0.5],["B2",0.5],["B3",0.5],["B2",0.5],["Fs3",0.5],["B2",0.5],["B3",0.5],["Fs3",0.5],
    ], 2)),
    },
  ],
  // simple kick on every beat for battle
  drumPattern: { bpm: 144, perBeat: 1, bars: 8 },
};

// ───── TOWN: warm, cozy, lilting (F - C - G - Am) ─────
const TOWN = {
  bpm: 92, bars: 8,
  instruments: [
    { type: "triangle", gain: 0.16, detune: 0, pattern: [
      // F 2bars
      ["F4",1],["A4",0.5],["C5",0.5],["A4",1],["F4",1],
      ["G4",1],["A4",1],["F4",2],
      // C 2bars
      ["E4",1],["G4",0.5],["C5",0.5],["G4",1],["E4",1],
      ["F4",1],["G4",1],["E4",2],
      // G 2bars
      ["D4",1],["G4",0.5],["B4",0.5],["G4",1],["D4",1],
      ["E4",1],["F4",1],["D4",2],
      // Am 2bars
      ["C4",1],["E4",0.5],["A4",0.5],["E4",1],["C4",1],
      ["D4",1],["E4",1],["A4",2],
    ]},
    { type: "sine", gain: 0.09, detune: 6, pattern: [
      ["C4",4],["F4",4],
      ["G3",4],["E4",4],
      ["B3",4],["D4",4],
      ["E4",4],["C4",4],
    ]},
    { type: "triangle", gain: 0.24, detune: 0, pattern: [
      // Arpeggiated chord roots
      ["F2",1],["C3",1],["F3",1],["C3",1],
      ["F2",1],["C3",1],["F3",1],["C3",1],
      ["C3",1],["G3",1],["C3",1],["E3",1],
      ["C3",1],["G3",1],["C3",1],["E3",1],
      ["G2",1],["D3",1],["G3",1],["D3",1],
      ["G2",1],["D3",1],["G3",1],["D3",1],
      ["A2",1],["E3",1],["A3",1],["E3",1],
      ["A2",1],["E3",1],["A3",1],["E3",1],
    ]},
  ],
};

// ───── BOSS: darker, faster, menacing (Em - Bm - C - D, E natural minor) ─────
const BOSS = {
  bpm: 158, bars: 8,
  instruments: [
    { type: "square", gain: 0.14, detune: 0, pattern: [
      // Em 2bars - aggressive 16th-feel
      ["E5",0.5],["G5",0.5],["B5",0.5],["G5",0.5],["E5",0.5],["B4",0.5],["G5",0.5],["B5",0.5],
      ["A5",1],["G5",0.5],["E5",0.5],["B4",1],["E5",1],
      // Bm 2bars
      ["B4",0.5],["D5",0.5],["Fs5",0.5],["D5",0.5],["B4",0.5],["Fs4",0.5],["D5",0.5],["Fs5",0.5],
      ["G5",1],["Fs5",0.5],["D5",0.5],["B4",1],["D5",1],
      // C 2bars
      ["C5",0.5],["E5",0.5],["G5",0.5],["E5",0.5],["C5",0.5],["G4",0.5],["E5",0.5],["G5",0.5],
      ["A5",1],["G5",0.5],["E5",0.5],["C5",1],["E5",1],
      // D 2bars
      ["D5",0.5],["Fs5",0.5],["A5",0.5],["Fs5",0.5],["D5",0.5],["A4",0.5],["Fs5",0.5],["A5",0.5],
      ["B5",1],["A5",0.5],["Fs5",0.5],["D5",1],["A5",1],
    ]},
    { type: "sawtooth", gain: 0.07, detune: -9, pattern: [
      // Tritone-tinted counter-melody for menace
      ["B4",2],["E4",2],["B4",2],["G5",2],
      ["Fs4",2],["B3",2],["Fs4",2],["D5",2],
      ["G4",2],["C4",2],["G4",2],["E5",2],
      ["A4",2],["D4",2],["A4",2],["Fs5",2],
    ]},
    { type: "triangle", gain: 0.32, detune: 0, pattern: rep([
      // Pounding 8th-note bass — root, octave-up, fifth
      ["E2",0.5],["E3",0.5],["B2",0.5],["E2",0.5],["E2",0.5],["E3",0.5],["B2",0.5],["G2",0.5],
    ], 2).concat(rep([
      ["B2",0.5],["B3",0.5],["Fs3",0.5],["B2",0.5],["B2",0.5],["B3",0.5],["Fs3",0.5],["D3",0.5],
    ], 2)).concat(rep([
      ["C3",0.5],["C3",0.5],["G3",0.5],["C3",0.5],["E3",0.5],["C3",0.5],["G3",0.5],["E3",0.5],
    ], 2)).concat(rep([
      ["D3",0.5],["D3",0.5],["A3",0.5],["D3",0.5],["Fs3",0.5],["D3",0.5],["A3",0.5],["Fs3",0.5],
    ], 2)),
    },
  ],
  // Heavier kick: every beat plus an off-beat double on the &-of-1 each bar
  drumPattern: { bpm: 158, perBeat: 1, bars: 8 },
};

const TRACKS = { title: TITLE, travel: TRAVEL, battle: BATTLE, town: TOWN, boss: BOSS };

function scheduleNote(ctx, dest, type, freq, detune, startT, dur, peakGain) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  if (detune) osc.detune.value = detune;
  const g = ctx.createGain();
  const safeDur = Math.max(0.05, dur);
  // Soft ADSR — fast attack, gentle release for chiptune feel.
  g.gain.setValueAtTime(0, startT);
  g.gain.linearRampToValueAtTime(peakGain, startT + 0.012);
  g.gain.linearRampToValueAtTime(peakGain * 0.55, startT + safeDur * 0.55);
  g.gain.linearRampToValueAtTime(0.0001, startT + safeDur);
  osc.connect(g).connect(dest);
  osc.start(startT);
  osc.stop(startT + safeDur + 0.04);
}

function scheduleKick(ctx, dest, startT, peakGain) {
  // Cheap synth kick: pitched-down sine sweep.
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(140, startT);
  osc.frequency.exponentialRampToValueAtTime(45, startT + 0.10);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, startT);
  g.gain.linearRampToValueAtTime(peakGain, startT + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, startT + 0.18);
  osc.connect(g).connect(dest);
  osc.start(startT);
  osc.stop(startT + 0.22);
}

export function createMusicPlayer() {
  let ctx = null;
  let masterGain = null;
  let muted = false;
  try { muted = typeof localStorage !== "undefined" && localStorage.getItem("sv_music_muted") === "1"; } catch {}
  let volume = 0.20;
  let currentTrack = null;
  let scheduledTimer = null;
  let nextLoopAt = 0;

  function ensure() {
    if (!ctx) {
      try {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return false;
        ctx = new C();
        masterGain = ctx.createGain();
        masterGain.gain.value = muted ? 0 : volume;
        masterGain.connect(ctx.destination);
      } catch (e) { return false; }
    }
    if (ctx.state === "suspended") { try { ctx.resume(); } catch {} }
    return true;
  }

  function scheduleLoop(track, startTime) {
    const t = TRACKS[track];
    if (!t) return startTime;
    const beat = 60 / t.bpm;
    const totalBeats = t.bars * 4;

    t.instruments.forEach(({ type, gain, detune, pattern }) => {
      let pos = 0;
      for (const entry of pattern) {
        const [note, dur] = entry;
        if (note && NOTE[note]) {
          const startT = startTime + pos * beat;
          const dt = dur * beat;
          scheduleNote(ctx, masterGain, type, NOTE[note], detune || 0, startT, dt * 0.92, gain);
        }
        pos += dur;
      }
    });

    if (t.drumPattern) {
      for (let b = 0; b < totalBeats; b += t.drumPattern.perBeat) {
        scheduleKick(ctx, masterGain, startTime + b * beat, 0.20);
      }
    }

    return startTime + totalBeats * beat;
  }

  function loopForever(track) {
    if (!ctx) return;
    const now = ctx.currentTime;
    if (nextLoopAt < now + 0.05) nextLoopAt = now + 0.05;
    const endsAt = scheduleLoop(track, nextLoopAt);
    nextLoopAt = endsAt;
    const t = TRACKS[track];
    const loopMs = (t.bars * 4 * 60 / t.bpm) * 1000;
    if (scheduledTimer) clearTimeout(scheduledTimer);
    scheduledTimer = setTimeout(() => {
      if (currentTrack === track) loopForever(track);
    }, Math.max(50, loopMs - 300));
  }

  return {
    play(track) {
      if (!track || !TRACKS[track]) {
        currentTrack = null;
        if (scheduledTimer) { clearTimeout(scheduledTimer); scheduledTimer = null; }
        return;
      }
      if (track === currentTrack && ctx && ctx.state !== "suspended") return;
      if (!ensure()) return;
      const wasDifferent = track !== currentTrack;
      currentTrack = track;
      if (wasDifferent) {
        // Quick fade-in by resetting nextLoopAt to "now"
        nextLoopAt = ctx.currentTime + 0.08;
        if (scheduledTimer) { clearTimeout(scheduledTimer); scheduledTimer = null; }
      }
      loopForever(track);
    },
    stop() {
      currentTrack = null;
      if (scheduledTimer) { clearTimeout(scheduledTimer); scheduledTimer = null; }
      if (masterGain && ctx) {
        const t = ctx.currentTime;
        masterGain.gain.cancelScheduledValues(t);
        masterGain.gain.setValueAtTime(masterGain.gain.value, t);
        masterGain.gain.linearRampToValueAtTime(0, t + 0.2);
        setTimeout(() => { if (masterGain && !muted) masterGain.gain.value = volume; }, 240);
      }
    },
    setMuted(m) {
      muted = !!m;
      try { localStorage.setItem("sv_music_muted", muted ? "1" : "0"); } catch {}
      if (masterGain && ctx) {
        const t = ctx.currentTime;
        masterGain.gain.cancelScheduledValues(t);
        masterGain.gain.linearRampToValueAtTime(muted ? 0 : volume, t + 0.15);
      }
    },
    isMuted() { return muted; },
    currentTrack() { return currentTrack; },
  };
}

// Boss-tier battle types get the heavier BOSS track. Wild encounters and
// duels use the standard battle loop.
const BOSS_BATTLE_TYPES = new Set(["boss", "fieldboss", "rift", "outpost"]);

export function trackForScreen(scr, opts = {}) {
  if (scr === "title" || scr === "create") return "title";
  if (scr === "battle") {
    if (opts.battleType && BOSS_BATTLE_TYPES.has(opts.battleType)) return "boss";
    return "battle";
  }
  if (scr === "town") return "town";
  if (scr === "map" || scr === "submap") return "travel";
  return null; // shell / stats / etc → keep current track playing
}
