// Shattered Veil — atmospheric music engine (v48)
// Replaces v41 chiptune. Smoother sine + triangle voices with longer envelopes,
// a master delay/feedback bus for ambient spaciousness, slower BPMs, and a
// per-track bus that we fade-out cleanly to fix the v41 track-overlap bug
// (old loop's already-scheduled oscillators kept playing alongside the new one).

const NOTE = {
  "C2":65.41,"D2":73.42,"E2":82.41,"F2":87.31,"G2":98.00,"A2":110.00,"B2":123.47,
  "C3":130.81,"Cs3":138.59,"D3":146.83,"Ds3":155.56,"E3":164.81,"F3":174.61,"Fs3":185.00,
  "G3":196.00,"Gs3":207.65,"A3":220.00,"As3":233.08,"B3":246.94,
  "C4":261.63,"Cs4":277.18,"D4":293.66,"Ds4":311.13,"E4":329.63,"F4":349.23,"Fs4":369.99,
  "G4":392.00,"Gs4":415.30,"A4":440.00,"As4":466.16,"B4":493.88,
  "C5":523.25,"Cs5":554.37,"D5":587.33,"Ds5":622.25,"E5":659.25,"F5":698.46,"Fs5":739.99,
  "G5":783.99,"Gs5":830.61,"A5":880.00,"As5":932.33,"B5":987.77,"C6":1046.50,
};

function rep(pattern, n) { const out = []; for (let i = 0; i < n; i++) for (const e of pattern) out.push(e); return out; }

// Voice spec: { type, gain, attack, release, detune, pattern }
//   type: "sine" | "triangle"  (no square / sawtooth — chippy harshness banned)
//   attack/release in seconds — long attack = string-like swell
//   pattern: [["NoteOrNull", beats], ...] summing to bars*4 beats

// ───── TITLE: slow, contemplative, mysterious (Am - F - C - G) ─────
const TITLE = {
  bpm: 60, bars: 8,
  instruments: [
    // Lead: airy triangle melody, long swells
    { type: "triangle", gain: 0.08, attack: 0.20, release: 0.50, detune: 0, pattern: [
      ["A4",4],["E5",4],
      ["F4",4],["C5",4],
      ["C5",4],["G4",4],
      ["G4",4],["B4",4],
    ]},
    // Pad chord: sine drone, long attack for cinematic swell
    { type: "sine", gain: 0.07, attack: 0.55, release: 1.0, detune: 8, pattern: [
      ["A3",4],["A3",4],
      ["F3",4],["F3",4],
      ["C4",4],["C4",4],
      ["G3",4],["G3",4],
    ]},
    // Pad harmony (slightly flat for chorus-like richness)
    { type: "sine", gain: 0.06, attack: 0.55, release: 1.0, detune: -8, pattern: [
      ["E4",4],["E4",4],
      ["A3",4],["A3",4],
      ["E4",4],["E4",4],
      ["B3",4],["B3",4],
    ]},
    // Bass: triangle, deep root pulses
    { type: "triangle", gain: 0.13, attack: 0.05, release: 0.40, detune: 0, pattern: [
      ["A2",8],
      ["F2",8],
      ["C2",8],
      ["G2",8],
    ]},
  ],
};

// ───── TRAVEL: hopeful, flowing, lyrical (C - G - Am - F) ─────
const TRAVEL = {
  bpm: 92, bars: 8,
  instruments: [
    // Lead: triangle, lyrical phrasing
    { type: "triangle", gain: 0.09, attack: 0.05, release: 0.30, detune: 0, pattern: [
      ["G4",1],["A4",1],["G4",1],["E4",1],["G4",2],["C5",2],
      ["G4",1],["A4",1],["B4",1],["G4",1],["D5",2],["B4",2],
      ["A4",1],["C5",1],["E5",1],["C5",1],["A4",2],["E5",2],
      ["F4",1],["A4",1],["G4",1],["F4",1],["A4",2],["F4",2],
    ]},
    // Pad: sine harmony with detune chorus
    { type: "sine", gain: 0.06, attack: 0.30, release: 0.70, detune: 6, pattern: [
      ["E4",4],["G4",4],
      ["D4",4],["G4",4],
      ["C4",4],["E4",4],
      ["A3",4],["C4",4],
    ]},
    // Walking bass
    { type: "triangle", gain: 0.13, attack: 0.04, release: 0.30, detune: 0, pattern: [
      ["C3",2],["G2",2],["C3",2],["E3",2],
      ["C3",2],["G2",2],["C3",2],["E3",2],
      ["G2",2],["D3",2],["G2",2],["B2",2],
      ["G2",2],["D3",2],["G2",2],["B2",2],
      ["A2",2],["E3",2],["A2",2],["C3",2],
      ["A2",2],["E3",2],["A2",2],["C3",2],
      ["F2",2],["C3",2],["F2",2],["A2",2],
      ["F2",2],["C3",2],["F2",2],["A2",2],
    ]},
  ],
};

// ───── BATTLE: tense, driving, but musical (Em - C - D - B7) ─────
const BATTLE = {
  bpm: 116, bars: 8,
  instruments: [
    // Lead: triangle (was square — kills the 8-bit shrillness)
    { type: "triangle", gain: 0.10, attack: 0.03, release: 0.25, detune: 0, pattern: [
      ["E4",1],["G4",1],["B4",1],["G4",1],["E5",2],["B4",2],
      ["E4",1],["G4",1],["B4",1],["A4",1],["G4",2],["E4",2],
      ["C4",1],["E4",1],["G4",1],["E4",1],["C5",2],["G4",2],
      ["C4",1],["E4",1],["G4",1],["A4",1],["G4",2],["E4",2],
      ["D4",1],["Fs4",1],["A4",1],["Fs4",1],["D5",2],["A4",2],
      ["D4",1],["Fs4",1],["A4",1],["B4",1],["A4",2],["Fs4",2],
      ["B3",1],["Ds4",1],["Fs4",1],["B4",1],["Fs4",2],["Ds4",2],
      ["B3",1],["Fs4",1],["B4",1],["Fs4",1],["B4",4],
    ]},
    // Counter melody: sine pad
    { type: "sine", gain: 0.06, attack: 0.20, release: 0.50, detune: 7, pattern: [
      ["B4",4],["E4",4],
      ["G4",4],["C4",4],
      ["A4",4],["D4",4],
      ["Fs4",4],["B3",4],
    ]},
    // Bass: pulsing triangle, no longer hammering 8ths
    { type: "triangle", gain: 0.15, attack: 0.03, release: 0.30, detune: 0, pattern: rep([
      ["E2",1],["E3",1],["B2",1],["E3",1],
    ], 2).concat(rep([
      ["C2",1],["C3",1],["G2",1],["C3",1],
    ], 2)).concat(rep([
      ["D2",1],["D3",1],["A2",1],["D3",1],
    ], 2)).concat(rep([
      ["B2",1],["B3",1],["Fs3",1],["B3",1],
    ], 2)),
    },
  ],
  // Soft kick on every beat — calmer than v41's punchy 144 BPM kick
  drumPattern: { perBeat: 1, gain: 0.10 },
};

// ───── TOWN: warm, intimate, hearth (F - C - G - Am) ─────
const TOWN = {
  bpm: 78, bars: 8,
  instruments: [
    { type: "triangle", gain: 0.09, attack: 0.06, release: 0.40, detune: 0, pattern: [
      ["F4",1.5],["A4",0.5],["C5",2],["A4",2],["F4",2],
      ["C5",1.5],["E5",0.5],["F5",2],["E5",2],["C5",2],
      ["E4",1.5],["G4",0.5],["B4",2],["G4",2],["D4",2],
      ["A4",1.5],["C5",0.5],["E5",2],["A4",2],["E4",2],
    ]},
    { type: "sine", gain: 0.07, attack: 0.30, release: 0.70, detune: 6, pattern: [
      ["C4",4],["F4",4],
      ["G3",4],["E4",4],
      ["B3",4],["D4",4],
      ["E4",4],["C4",4],
    ]},
    { type: "triangle", gain: 0.13, attack: 0.04, release: 0.30, detune: 0, pattern: [
      ["F2",2],["C3",2],["F2",2],["A2",2],
      ["F2",2],["C3",2],["F2",2],["A2",2],
      ["C3",2],["G3",2],["C3",2],["E3",2],
      ["C3",2],["G3",2],["C3",2],["E3",2],
      ["G2",2],["D3",2],["G2",2],["B2",2],
      ["G2",2],["D3",2],["G2",2],["B2",2],
      ["A2",2],["E3",2],["A2",2],["C3",2],
      ["A2",2],["E3",2],["A2",2],["C3",2],
    ]},
  ],
};

// ───── BOSS: darker, heavier, but lush — not chippy (Em - Bm - C - D) ─────
const BOSS = {
  bpm: 124, bars: 8,
  instruments: [
    { type: "triangle", gain: 0.10, attack: 0.03, release: 0.25, detune: 0, pattern: [
      ["E5",1],["G5",1],["B5",1],["G5",1],["E5",2],["B4",2],
      ["E5",1],["D5",1],["B4",1],["G4",1],["E4",4],
      ["B4",1],["D5",1],["Fs5",1],["D5",1],["B4",2],["Fs4",2],
      ["B4",1],["A4",1],["Fs4",1],["D4",1],["B3",4],
      ["C5",1],["E5",1],["G5",1],["E5",1],["C5",2],["G4",2],
      ["C5",1],["B4",1],["G4",1],["E4",1],["C4",4],
      ["D5",1],["Fs5",1],["A5",1],["Fs5",1],["D5",2],["A4",2],
      ["D5",1],["A4",1],["Fs4",1],["D4",1],["A3",4],
    ]},
    { type: "sine", gain: 0.06, attack: 0.25, release: 0.60, detune: -8, pattern: [
      ["B3",4],["E4",4],
      ["Fs3",4],["B3",4],
      ["G3",4],["C4",4],
      ["A3",4],["D4",4],
    ]},
    { type: "triangle", gain: 0.17, attack: 0.03, release: 0.25, detune: 0, pattern: rep([
      ["E2",1],["E3",1],["B2",1],["G2",1],
    ], 2).concat(rep([
      ["B2",1],["Fs3",1],["D3",1],["B2",1],
    ], 2)).concat(rep([
      ["C3",1],["G3",1],["E3",1],["C3",1],
    ], 2)).concat(rep([
      ["D3",1],["A3",1],["Fs3",1],["D3",1],
    ], 2)),
    },
  ],
  drumPattern: { perBeat: 1, gain: 0.13 },
};

const TRACKS = { title: TITLE, travel: TRAVEL, battle: BATTLE, town: TOWN, boss: BOSS };

function scheduleNote(ctx, dest, type, freq, detune, startT, dur, peakGain, attack, release) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  if (detune) osc.detune.value = detune;
  const g = ctx.createGain();
  const safeDur = Math.max(0.06, dur);
  const a = Math.min(attack || 0.04, safeDur * 0.5);
  const r = release || 0.20;
  g.gain.setValueAtTime(0, startT);
  g.gain.linearRampToValueAtTime(peakGain, startT + a);
  g.gain.setValueAtTime(peakGain * 0.85, startT + safeDur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, startT + safeDur + r);
  osc.connect(g).connect(dest);
  osc.start(startT);
  osc.stop(startT + safeDur + r + 0.05);
}

function scheduleKick(ctx, dest, startT, peakGain) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(120, startT);
  osc.frequency.exponentialRampToValueAtTime(40, startT + 0.10);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, startT);
  g.gain.linearRampToValueAtTime(peakGain, startT + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, startT + 0.18);
  osc.connect(g).connect(dest);
  osc.start(startT);
  osc.stop(startT + 0.22);
}

// ─── SFX bank (short percussive cues, all synthesized) ───
function sfxHit(ctx, dest, t0, gain) {
  const dur = 0.12;
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const filt = ctx.createBiquadFilter(); filt.type = "lowpass";
  filt.frequency.setValueAtTime(2400, t0);
  filt.frequency.exponentialRampToValueAtTime(400, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filt).connect(g).connect(dest);
  src.start(t0); src.stop(t0 + dur + 0.02);
}
function sfxHeal(ctx, dest, t0, gain) {
  [880, 1320].forEach((f, i) => {
    const osc = ctx.createOscillator(); osc.type = "sine"; osc.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain * (i ? 0.5 : 1), t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
    osc.connect(g).connect(dest);
    osc.start(t0); osc.stop(t0 + 0.5);
  });
}
function sfxLevelUp(ctx, dest, t0, gain) {
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((f, i) => {
    const tn = t0 + i * 0.085;
    const osc = ctx.createOscillator(); osc.type = "triangle"; osc.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, tn);
    g.gain.linearRampToValueAtTime(gain * 0.6, tn + 0.008);
    g.gain.linearRampToValueAtTime(gain * 0.3, tn + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, tn + 0.18);
    osc.connect(g).connect(dest);
    osc.start(tn); osc.stop(tn + 0.2);
  });
}
function sfxVictory(ctx, dest, t0, gain) {
  [523.25, 659.25, 783.99].forEach((f) => {
    const osc = ctx.createOscillator(); osc.type = "triangle"; osc.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain * 0.5, t0 + 0.02);
    g.gain.linearRampToValueAtTime(gain * 0.4, t0 + 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
    osc.connect(g).connect(dest);
    osc.start(t0); osc.stop(t0 + 0.95);
  });
}
function sfxDefeat(ctx, dest, t0, gain) {
  const osc = ctx.createOscillator(); osc.type = "sine";
  osc.frequency.setValueAtTime(220, t0);
  osc.frequency.exponentialRampToValueAtTime(82, t0 + 0.7);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain * 0.6, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.8);
  osc.connect(g).connect(dest);
  osc.start(t0); osc.stop(t0 + 0.85);
}
function sfxMenu(ctx, dest, t0, gain) {
  const osc = ctx.createOscillator(); osc.type = "sine"; osc.frequency.value = 880;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain * 0.4, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
  osc.connect(g).connect(dest);
  osc.start(t0); osc.stop(t0 + 0.07);
}
function sfxCrit(ctx, dest, t0, gain) {
  const osc = ctx.createOscillator(); osc.type = "triangle"; osc.frequency.setValueAtTime(1760, t0);
  osc.frequency.exponentialRampToValueAtTime(880, t0 + 0.08);
  const og = ctx.createGain();
  og.gain.setValueAtTime(gain * 0.5, t0);
  og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1);
  osc.connect(og).connect(dest);
  osc.start(t0); osc.stop(t0 + 0.12);
  const dur = 0.08;
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const filt = ctx.createBiquadFilter(); filt.type = "highpass"; filt.frequency.value = 2000;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(gain * 0.5, t0);
  ng.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filt).connect(ng).connect(dest);
  src.start(t0); src.stop(t0 + dur + 0.02);
}
function sfxCast(ctx, dest, t0, gain) {
  const osc = ctx.createOscillator(); osc.type = "sine";
  osc.frequency.setValueAtTime(220, t0);
  osc.frequency.exponentialRampToValueAtTime(880, t0 + 0.18);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain * 0.5, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
  osc.connect(g).connect(dest);
  osc.start(t0); osc.stop(t0 + 0.25);
}

const SFX_BANK = { hit: sfxHit, heal: sfxHeal, levelup: sfxLevelUp, victory: sfxVictory, defeat: sfxDefeat, menu: sfxMenu, cast: sfxCast, crit: sfxCrit };

export function createMusicPlayer() {
  let ctx = null;
  let masterGain = null;
  let sfxGain = null;
  let delayNode = null;     // ambient echo bus
  let delayFb = null;
  let delayWet = null;
  let musicBus = null;      // per-track bus (swappable for clean transitions)
  let muted = false;
  let sfxMuted = false;
  try { muted = typeof localStorage !== "undefined" && localStorage.getItem("sv_music_muted") === "1"; } catch {}
  try { sfxMuted = typeof localStorage !== "undefined" && localStorage.getItem("sv_sfx_muted") === "1"; } catch {}
  let volume = 0.20;
  let sfxVolume = 0.30;
  try {
    const v = parseFloat(localStorage.getItem("sv_music_vol")); if (!isNaN(v) && v >= 0 && v <= 1) volume = v;
    const sv = parseFloat(localStorage.getItem("sv_sfx_vol")); if (!isNaN(sv) && sv >= 0 && sv <= 1) sfxVolume = sv;
  } catch {}
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
        sfxGain = ctx.createGain();
        sfxGain.gain.value = sfxMuted ? 0 : sfxVolume;
        sfxGain.connect(ctx.destination);

        // Ambient echo: 380ms delay with subtle feedback for spaciousness.
        delayNode = ctx.createDelay(1.0);
        delayNode.delayTime.value = 0.38;
        delayFb = ctx.createGain();
        delayFb.gain.value = 0.28;
        delayWet = ctx.createGain();
        delayWet.gain.value = 0.55;
        delayNode.connect(delayFb).connect(delayNode);
        delayNode.connect(delayWet).connect(masterGain);
      } catch (e) { return false; }
    }
    if (ctx.state === "suspended") { try { ctx.resume(); } catch {} }
    return true;
  }

  function makeBus() {
    const bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(masterGain);
    // Wet send to ambient echo bus
    const send = ctx.createGain();
    send.gain.value = 0.22;
    bus.connect(send).connect(delayNode);
    return bus;
  }

  function fadeOutBus(bus) {
    if (!bus || !ctx) return;
    const t = ctx.currentTime;
    try {
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(bus.gain.value, t);
      bus.gain.linearRampToValueAtTime(0, t + 0.45);
    } catch {}
    setTimeout(() => { try { bus.disconnect(); } catch {} }, 700);
  }

  function scheduleLoop(track, startTime) {
    const t = TRACKS[track];
    if (!t || !musicBus) return startTime;
    const beat = 60 / t.bpm;
    const totalBeats = t.bars * 4;

    t.instruments.forEach(({ type, gain, detune, pattern, attack, release }) => {
      let pos = 0;
      for (const entry of pattern) {
        const [note, dur] = entry;
        if (note && NOTE[note]) {
          const startT = startTime + pos * beat;
          const dt = dur * beat;
          scheduleNote(ctx, musicBus, type, NOTE[note], detune || 0, startT, dt * 0.92, gain, attack || 0.04, release || 0.20);
        }
        pos += dur;
      }
    });

    if (t.drumPattern) {
      const dGain = t.drumPattern.gain || 0.15;
      for (let b = 0; b < totalBeats; b += t.drumPattern.perBeat) {
        scheduleKick(ctx, musicBus, startTime + b * beat, dGain);
      }
    }

    return startTime + totalBeats * beat;
  }

  function loopForever(track) {
    if (!ctx || !musicBus) return;
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
        if (musicBus) { fadeOutBus(musicBus); musicBus = null; }
        return;
      }
      if (track === currentTrack && ctx && ctx.state !== "suspended" && musicBus) return;
      if (!ensure()) return;
      const wasDifferent = track !== currentTrack;
      currentTrack = track;
      if (wasDifferent || !musicBus) {
        // Kill the old bus immediately — fixes the v41 overlap where
        // already-scheduled oscillators kept playing under the new track.
        if (musicBus) fadeOutBus(musicBus);
        musicBus = makeBus();
        nextLoopAt = ctx.currentTime + 0.10;
        if (scheduledTimer) { clearTimeout(scheduledTimer); scheduledTimer = null; }
      }
      loopForever(track);
    },
    stop() {
      currentTrack = null;
      if (scheduledTimer) { clearTimeout(scheduledTimer); scheduledTimer = null; }
      if (musicBus) { fadeOutBus(musicBus); musicBus = null; }
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
    playSfx(name) {
      if (sfxMuted) return;
      const fn = SFX_BANK[name];
      if (!fn) return;
      if (!ensure()) return;
      try { fn(ctx, sfxGain, ctx.currentTime + 0.005, 1); } catch {}
    },
    setSfxMuted(m) {
      sfxMuted = !!m;
      try { localStorage.setItem("sv_sfx_muted", sfxMuted ? "1" : "0"); } catch {}
      if (sfxGain && ctx) {
        const t = ctx.currentTime;
        sfxGain.gain.cancelScheduledValues(t);
        sfxGain.gain.linearRampToValueAtTime(sfxMuted ? 0 : sfxVolume, t + 0.05);
      }
    },
    isSfxMuted() { return sfxMuted; },
    setMusicVolume(v) {
      volume = Math.max(0, Math.min(1, +v || 0));
      try { localStorage.setItem("sv_music_vol", String(volume)); } catch {}
      if (masterGain && ctx && !muted) {
        const t = ctx.currentTime;
        masterGain.gain.cancelScheduledValues(t);
        masterGain.gain.linearRampToValueAtTime(volume, t + 0.1);
      }
    },
    setSfxVolume(v) {
      sfxVolume = Math.max(0, Math.min(1, +v || 0));
      try { localStorage.setItem("sv_sfx_vol", String(sfxVolume)); } catch {}
      if (sfxGain && ctx && !sfxMuted) {
        const t = ctx.currentTime;
        sfxGain.gain.cancelScheduledValues(t);
        sfxGain.gain.linearRampToValueAtTime(sfxVolume, t + 0.1);
      }
    },
    getMusicVolume() { return volume; },
    getSfxVolume() { return sfxVolume; },
  };
}

const BOSS_BATTLE_TYPES = new Set(["boss", "fieldboss", "rift", "outpost"]);

export function trackForScreen(scr, opts = {}) {
  if (scr === "title" || scr === "create") return "title";
  if (scr === "battle") {
    if (opts.battleType && BOSS_BATTLE_TYPES.has(opts.battleType)) return "boss";
    return "battle";
  }
  if (scr === "town") return "town";
  if (scr === "map" || scr === "submap") return "travel";
  return null;
}
