import React, { useMemo, useState, useCallback, useRef, useLayoutEffect, useEffect } from "react";
import {
  TERRAIN,
  OBJECTS,
  ARENA_THEMES,
  isRareTerrain,
} from "./arenaMaps.js";
import {
  getTerrainAt,
  getObjectsAt,
  getMovementRange,
} from "./arenaEngine.js";
import { getFxClassFromIntent } from "../actionIntent.js";

// ─────────────────────────────────────────────────────────────────────────
// BIG ARENA FOUNDATION — VISUAL COMPONENT (Pass 2, foundation only)
// ─────────────────────────────────────────────────────────────────────────
// Renders a battlefield preview using the current battle theme. Visual
// only — does NOT drive combat. The current lane-style battle UI remains
// the source of truth in this pass. Safe to mount with empty units.
// ─────────────────────────────────────────────────────────────────────────

const keyOf = (x, y) => x + "," + y;

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export default function ArenaBoard({
  arena,                  // result of createInitialArenaState(ctx)
  units = [],             // [{ id, kind:'player'|'ally'|'pet'|'enemy', label, ic, pos:{x,y}, hpPct, isTarget }]
  movementStat = 0,       // visual-only movement preview around the player
  showMovementPreview = true,
  veilbreakReady = false, // pulses player tile if Veilbreak is primed
  field = null,           // { name, owner:'player'|'enemy', element, intensity, zones:[{x,y}] }
  // Pass 8 — Field Clash visuals (purely cosmetic).
  enemyField = null,      // { name, theme, intensity, remainingTurns }
  fieldClash = null,      // { active, outcome, turnsRemaining, splitFieldZones, fracturedTiles }
  collapsed = false,
  onToggleCollapsed = null,
  isMobile = false,
  // Pass 3 — Tactical Step integration.
  moveMode = false,       // when true, clicking a valid tile commits a move.
  onTileSelect = null,    // (tile) => void — fires only on tiles inside move range.
  moveModeHint = null,    // optional banner text shown above the grid in move mode.
  // Pass 4 — Skill targeting integration (visual + soft enforcement only).
  targetingMode = false,  // when true, clicking a valid target tile commits the action.
  validTargetKeys = null, // Set<"x,y"> — highlightable target tiles.
  affectedKeys = null,    // Set<"x,y"> — preview area for the currently hovered/selected target.
  losBlockedKeys = null,  // Set<"x,y"> — tiles in range but blocked by line of sight.
  selectedTargetKey = null, // "x,y" — confirmed target tile (currently aimed-at).
  onTargetSelect = null,  // (tile) => void — fires when player clicks a valid target tile.
  onTargetHover = null,   // (tile|null) => void — for live area preview while aiming.
  targetingHint = null,   // optional banner text shown above the grid in targeting mode.
  // Pass 15 — tap a unit token to open its dossier (handled by Game.jsx).
  onUnitClick = null,     // (unit) => void — fires when a unit token is tapped.
  // v96 (Spec §D / §H) — intent class for tile-preview color foreshadowing.
  // One of: 'damage'|'debuff'|'heal'|'buff'|'support'|'move'|'veilbreak'|'field'|'object'|'mixed'.
  // When set, applies `is-fx-<intent>` to the grid + each affected tile.
  targetingFx = null,
  // v96 (Spec §A.4 / §F.19) — invalid-click feedback. Fires when player taps
  // a unit token in targeting mode whose unit kind doesn't satisfy the
  // current action's targetType. Game.jsx surfaces a toast/notify.
  onInvalidTargetClick = null, // ({ kind, reason }) => void
}) {
  const [hover, setHover] = useState(null);

  if (!arena) return null;
  const themeMeta = ARENA_THEMES[arena.template?.theme] || ARENA_THEMES.courtyard;
  const themeCls = themeMeta?.cls || "sv-arena-theme-courtyard";
  const themeLabel = themeMeta?.label || arena.template?.name || "Battlefield";
  // Pass 17 (v91) — paint the actual battlefield background through to CSS.
  const baseUrl = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL) || "/";
  const bgUrl = themeMeta?.bgImage ? `url('${baseUrl}${themeMeta.bgImage}')` : null;

  const player = units.find(u => u.kind === "player") || null;
  const occupied = units.filter(u => u && u.pos).map(u => u.pos);

  // Stable key from non-player occupancy so movement highlights refresh when
  // an enemy/ally/pet appears, dies, or relocates.
  const occupancyKey = useMemo(
    () => units.filter(u => u && u.kind !== "player" && u.pos).map(u => u.kind + ":" + u.pos.x + "," + u.pos.y).sort().join("|"),
    [units]
  );
  const moveRangeKeys = useMemo(() => {
    if (!showMovementPreview || !player || !player.pos || !movementStat) return new Set();
    const tiles = getMovementRange(player.pos, movementStat, arena, { occupied });
    return new Set(tiles.map(t => keyOf(t.x, t.y)));
    // occupied is rebuilt each render; we depend on occupancyKey to refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMovementPreview, player?.pos?.x, player?.pos?.y, movementStat, arena, occupancyKey]);

  const fieldKeys = useMemo(() => {
    if (!field || !Array.isArray(field.zones)) return new Set();
    return new Set(field.zones.map(z => keyOf(z.x, z.y)));
  }, [field]);

  const unitsByTile = useMemo(() => {
    const m = {};
    units.forEach(u => {
      if (!u || !u.pos) return;
      const k = keyOf(u.pos.x, u.pos.y);
      if (!m[k]) m[k] = [];
      m[k].push(u);
    });
    return m;
  }, [units]);

  // v94 (Pass 20) — Square tactical tiles. The Pass 13 hex visual is
  // disabled here in favor of a clean square grid — coords were already
  // cartesian (movement, range, LoS, AoE), so this is a render-only
  // change. Hex CSS is preserved at game.css L6981+ for fallback.
  // v97 (Hard Repair Pass §D) — fit-to-container tile sizing. Replaces the
  // old hard-coded 380/820 width assumptions with a real ResizeObserver on
  // the panel. The grid now genuinely fills its card and tokens never clip.
  const wrapRef = useRef(null);
  const [boxW, setBoxW] = useState(0);
  useLayoutEffect(() => {
    if (typeof window === "undefined") return undefined;
    const node = wrapRef.current;
    if (!node) return undefined;
    const measure = () => {
      const w = node.clientWidth;
      if (w && Math.abs(w - boxW) > 1) setBoxW(w);
    };
    measure();
    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      ro.observe(node);
    } else {
      window.addEventListener("resize", measure);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Reserve a sensible viewport-height ceiling so the grid never grows
  // past the visible card on tall arenas. Falls back to the legacy clamp
  // until the panel has measured itself.
  const _vh = (typeof window !== "undefined" && window.innerHeight) ? window.innerHeight : 720;
  // v99 — Mobile fit-to-board ceiling raised so 10×8 / 12×10 / 13×11 arenas
  // can show every row without clipping. Pairs with the v99 mobile battle
  // CSS that drops Zone A height (collapsible Stats/Readout) so the arena
  // panel actually has this much room. Floor lowered to 18px for very
  // wide boards on 390px phones; tokens still readable at 18×18.
  const _maxBoardH = isMobile
    ? Math.min(_vh * 0.58, 460)
    : Math.min(_vh * 0.56, 560);
  const _availW = boxW > 0 ? Math.max(0, boxW - 12) : (isMobile ? 360 : 800);
  const _byW = Math.floor(_availW / Math.max(1, arena.cols));
  const _byH = Math.floor(_maxBoardH / Math.max(1, arena.rows));
  const _measured = Math.min(_byW, _byH);
  const _floor = isMobile ? 18 : 28;
  const _ceil  = isMobile ? 48 : 72;
  const tileSize = boxW > 0
    ? clamp(_measured, _floor, _ceil)
    : (isMobile
        ? clamp(Math.floor(380 / arena.cols), 26, 40)
        : clamp(Math.floor(820 / arena.cols), 44, 64));
  const rowOverlap = 0; // square layout — no row tessellation overlap.

  const handleEnter = useCallback((x, y) => setHover({ x, y }), []);
  const handleLeave = useCallback(() => setHover(null), []);

  const hoverTerrain = hover ? getTerrainAt(hover, arena) : null;
  const hoverObjects = hover ? getObjectsAt(hover, arena) : [];
  const hoverUnits   = hover ? (unitsByTile[keyOf(hover.x, hover.y)] || []) : [];
  const hoverIsField = hover ? fieldKeys.has(keyOf(hover.x, hover.y)) : false;
  const hoverInRange = hover ? moveRangeKeys.has(keyOf(hover.x, hover.y)) : false;

  return (
    <div ref={wrapRef} className={"sv-arena-panel cd sv-arena-panel-fit " + themeCls + (field ? " sv-arena-field-active sv-arena-field-" + (field.theme || "void") : "") + (enemyField ? " sv-arena-enemy-field-active sv-arena-enemy-field-" + (enemyField.theme || "void") : "") + (fieldClash && fieldClash.active ? " sv-arena-clash-" + fieldClash.outcome : "") + (veilbreakReady && !field ? " sv-veilbreak-ready" : "")}>
      <div className="sv-arena-head">
        <div className="sv-arena-title">
          <span className="sv-arena-eyebrow">Battlefield Foundation</span>
          <span className="sv-arena-name">{arena.template?.name || themeLabel}</span>
        </div>
        <div className="sv-arena-meta">
          <span className="sv-arena-tag">{arena.cols}×{arena.rows}</span>
          {field && <span className="sv-arena-tag sv-arena-tag-field">{field.name || "Veilbreak Field"}{field.remainingTurns != null ? " · " + field.remainingTurns + "t" : ""}</span>}
          {enemyField && <span className="sv-arena-tag sv-arena-tag-enemy-field">⚔ {enemyField.name || "Enemy Field"}{enemyField.remainingTurns != null ? " · " + enemyField.remainingTurns + "t" : ""}</span>}
          {fieldClash && fieldClash.active && <span className={"sv-arena-tag sv-arena-tag-clash sv-arena-tag-clash-" + fieldClash.outcome}>⚡ {String(fieldClash.outcome || "").toUpperCase()}</span>}
          {veilbreakReady && !field && <span className="sv-arena-tag sv-arena-tag-primed">Veilbreak primed</span>}
          {moveMode && <span className="sv-arena-tag sv-arena-tag-move">Select destination</span>}
          {targetingMode && <span className="sv-arena-tag sv-arena-tag-target">Select target</span>}
          {onToggleCollapsed && (
            <button type="button" className="sv-arena-toggle" onClick={onToggleCollapsed}>
              {collapsed ? "Show" : "Hide"}
            </button>
          )}
        </div>
      </div>
      {!collapsed && (
        <>
          {moveMode && moveModeHint && (
            <div className="sv-arena-movemode-banner">{moveModeHint}</div>
          )}
          {targetingMode && targetingHint && (
            <div className="sv-arena-targeting-banner">{targetingHint}</div>
          )}
          <div
            className={"sv-arena-grid sv-arena-grid-sq" + (moveMode ? " sv-arena-movement-mode" : "") + (targetingMode ? " sv-arena-targeting-mode" : "") + (bgUrl ? " sv-arena-grid-has-bg" : "") + (targetingMode && targetingFx ? " " + getFxClassFromIntent(targetingFx) : "")}
            style={{
              "--svh-tile": tileSize + "px",
              "--svh-offset": Math.round(tileSize * 0.5) + "px",
              "--svh-overlap": rowOverlap + "px",
              "--sv-arena-bg-img": bgUrl || "none",
            }}
            onMouseLeave={handleLeave}
          >
            {Array.from({ length: arena.rows }).map((_, y) => (
              <div
                key={"row_" + y}
                className={"sv-arena-hex-row " + (y % 2 === 1 ? "is-odd" : "is-even")}
                style={{ marginTop: y === 0 ? 0 : -rowOverlap }}
              >
              {Array.from({ length: arena.cols }).map((__, x) => {
                const valid = arena.shape[y] && arena.shape[y][x] === 1;
                if (!valid) return <div key={keyOf(x, y)} className="sv-arena-tile sv-arena-tile-void" style={{ width: tileSize, height: tileSize }} />;
                const k = keyOf(x, y);
                const terrainKey = arena.terrainMap[k] || "normal";
                const terrain = TERRAIN[terrainKey] || TERRAIN.normal;
                const objs = arena.objectMap[k] ? [arena.objectMap[k]] : [];
                const tileUnits = unitsByTile[k] || [];
                const isRare = isRareTerrain(terrainKey);
                const inMove = moveRangeKeys.has(k);
                const inField = fieldKeys.has(k);
                const isHover = hover && hover.x === x && hover.y === y;
                const isOccupied = tileUnits.length > 0;
                const isMoveValid = moveMode && inMove && !isOccupied;
                const isTargetValid    = targetingMode && validTargetKeys ? validTargetKeys.has(k) : false;
                const isTargetSelected = targetingMode && selectedTargetKey === k;
                const isTargetAffected = targetingMode && affectedKeys ? affectedKeys.has(k) : false;
                const isLosBlocked     = targetingMode && losBlockedKeys ? losBlockedKeys.has(k) : false;
                const isOutOfRange     = targetingMode && !isTargetValid && !isTargetAffected && !isLosBlocked;
                const cls = [
                  "sv-arena-tile",
                  terrain.cls,
                  isRare ? "sv-arena-rare-tile" : "",
                  inMove && !moveMode ? "is-in-move" : "",
                  isMoveValid ? "sv-arena-tile-move-valid" : "",
                  moveMode && isOccupied ? "sv-arena-tile-occupied" : "",
                  isTargetValid    ? "sv-arena-tile-target-valid" : "",
                  isTargetSelected ? "sv-arena-tile-target-selected" : "",
                  isTargetAffected ? "sv-arena-tile-area-preview" : "",
                  isLosBlocked     ? "sv-arena-tile-los-blocked" : "",
                  isOutOfRange     ? "sv-arena-tile-out-of-range" : "",
                  // v96 — paint each valid/affected tile with the action's intent color.
                  (isTargetValid || isTargetAffected) && targetingFx ? getFxClassFromIntent(targetingFx) : "",
                  isLosBlocked ? "is-fx-blocked" : "",
                  targetingMode && objs.length ? "sv-arena-tile-has-object" : "",
                  inField ? "sv-arena-field-overlay" : "",
                  // Pass 8 — Field Clash tile flair. Split-field paints
                  // alternate tiles with the two clashing themes.
                  fieldClash && fieldClash.active && fieldClash.outcome === "split" && fieldClash.splitFieldZones
                    ? "sv-arena-tile-split-field-" + (((x + y) % 2 === 0) ? "a" : "b") + " sv-arena-tile-split-" + (((x + y) % 2 === 0) ? (fieldClash.splitFieldZones.a || "void") : (fieldClash.splitFieldZones.b || "void"))
                    : "",
                  fieldClash && fieldClash.active && (fieldClash.outcome === "fracture" || fieldClash.outcome === "collapse") && (((x * 7 + y * 11) % 5) === 0)
                    ? "sv-arena-tile-fractured-field"
                    : "",
                  isHover ? "is-hover" : "",
                ].filter(Boolean).join(" ");
                const handleTileClick = () => {
                  // Pass 17 (v91) — tap-to-move is always-on. Clicking any
                  // empty in-range tile commits a move (no need to first tap
                  // a "Move" button). Targeting-mode and explicit moveMode
                  // still work as before.
                  if (targetingMode && isTargetValid && typeof onTargetSelect === "function") {
                    onTargetSelect({ x, y });
                    return;
                  }
                  if (!targetingMode && inMove && !isOccupied && typeof onTileSelect === "function") {
                    onTileSelect({ x, y });
                    return;
                  }
                  setHover(h => h && h.x === x && h.y === y ? null : { x, y });
                };
                const handleEnterCombined = () => {
                  handleEnter(x, y);
                  if (targetingMode && isTargetValid && typeof onTargetHover === "function") {
                    onTargetHover({ x, y });
                  }
                };
                return (
                  <div
                    key={k}
                    className={cls}
                    style={{ width: tileSize, height: tileSize }}
                    onMouseEnter={handleEnterCombined}
                    onClick={handleTileClick}
                  >
                    {objs.map(o => {
                      const def = OBJECTS[o.key];
                      if (!def) return null;
                      return (
                        <span key={o.id} className={"sv-arena-object " + (def.cls || "")} title={def.nm}>
                          {def.glyph}
                        </span>
                      );
                    })}
                    {tileUnits.map(u => {
                      const tileKey = keyOf(u.pos.x, u.pos.y);
                      const unitTileValid = targetingMode && validTargetKeys ? validTargetKeys.has(tileKey) : false;
                      const unitClickableTarget = targetingMode && unitTileValid;
                      const unitCls = "sv-arena-unit " +
                        (u.kind === "enemy" ? "is-enemy" : u.kind === "player" ? "is-player" : "is-friend") +
                        (u.isTarget ? " is-target" : "") +
                        (u.kind === "player" && veilbreakReady ? " is-primed" : "") +
                        ((typeof onUnitClick === "function" && !moveMode && !targetingMode) || unitClickableTarget ? " is-clickable" : "") +
                        (unitClickableTarget ? " sv-arena-unit-targetable " + getFxClassFromIntent(targetingFx || "damage") : "");
                      const fallbackGlyph = u.ic || (u.kind === "enemy" ? "👾" : "🗡");
                      const handleUnitClick = (ev) => {
                        // v96 — in targeting mode, a tap on a unit token routes
                        // to onTargetSelect when the unit's tile is a valid
                        // target. If invalid (e.g. clicked an ally during an
                        // enemy-targeting action), surface an invalid-click
                        // event so Game.jsx can show clear feedback. (Spec §A.3 / §F.19)
                        if (targetingMode) {
                          ev.stopPropagation();
                          if (unitTileValid && typeof onTargetSelect === "function") {
                            try { onTargetSelect({ x: u.pos.x, y: u.pos.y }); } catch(_) {}
                          } else if (typeof onInvalidTargetClick === "function") {
                            try { onInvalidTargetClick({ kind: u.kind, unit: u }); } catch(_) {}
                          }
                          return;
                        }
                        if (!onUnitClick || moveMode) return;
                        ev.stopPropagation();
                        try { onUnitClick(u); } catch(_){}
                      };
                      return (
                        <span key={u.id} className={unitCls} title={u.label} onClick={handleUnitClick}>
                          {/* Pass 13 — always render the icon underneath; the
                              portrait <img> sits on top via absolute fill.
                              If the image errors (or is missing), the icon
                              remains visible. Mirrors the replit.md gotcha:
                              "render the fallback first, then layer the
                              portrait on top". */}
                          <span className="sv-arena-unit-ic">{fallbackGlyph}</span>
                          {u.portraitSrc && (
                            <img
                              src={u.portraitSrc}
                              alt={u.label || ""}
                              draggable={false}
                              className="sv-arena-unit-portrait"
                              referrerPolicy="no-referrer"
                              onError={(ev) => { try { ev.currentTarget.style.display = "none"; } catch(_){} }}
                            />
                          )}
                          {Number.isFinite(u.hpPct) && (
                            <span className="sv-arena-unit-hp">
                              <span style={{ width: clamp(u.hpPct, 0, 100) + "%" }} />
                            </span>
                          )}
                        </span>
                      );
                    })}
                    {isRare && <span className="sv-arena-rare-glow" aria-hidden="true" />}
                  </div>
                );
              })}
              </div>
            ))}
          </div>
          <div className="sv-arena-footer">
            {hover ? (
              <div className="sv-arena-tooltip">
                <div className="sv-arena-tooltip-title">
                  ({hover.x},{hover.y}) · {hoverTerrain?.label || "Open Ground"}
                  {hoverInRange && <span className="sv-arena-tooltip-pill">in move range</span>}
                  {hoverIsField && <span className="sv-arena-tooltip-pill is-field">in Veilbreak field</span>}
                </div>
                {hoverTerrain?.ds && <div className="sv-arena-tooltip-line">{hoverTerrain.ds}</div>}
                {hoverTerrain?.bonusHint && <div className="sv-arena-tooltip-bonus">{hoverTerrain.bonusHint}</div>}
                {hoverObjects.map(o => (
                  <div key={o.id} className="sv-arena-tooltip-line">
                    <b>{o.def?.nm}</b> — HP {o.hp}{o.def?.blocksMovement ? " · blocks movement" : ""}{o.def?.blocksLineOfSight ? " · blocks sight" : ""}.
                    {o.def?.onDestroy && <span className="sv-arena-tooltip-todo"> {o.def.onDestroy}</span>}
                  </div>
                ))}
                {hoverUnits.map(u => (
                  <div key={u.id} className="sv-arena-tooltip-line">
                    <b>{u.label}</b>{u.kind === "enemy" ? " (enemy)" : u.kind === "player" ? " (you)" : ""}
                    {Number.isFinite(u.hpPct) ? ` · HP ${Math.round(u.hpPct)}%` : ""}
                  </div>
                ))}
              </div>
            ) : (
              <div className="sv-arena-hint">{arena.template?.ds || "Hover a tile for details. Visual preview only — combat still runs on the lane bar above."}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
