import React, { useMemo, useState, useCallback } from "react";
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
}) {
  const [hover, setHover] = useState(null);

  if (!arena) return null;
  const themeCls = ARENA_THEMES[arena.template?.theme]?.cls || "sv-arena-theme-courtyard";
  const themeLabel = ARENA_THEMES[arena.template?.theme]?.label || arena.template?.name || "Battlefield";

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

  const tileSize = isMobile
    ? clamp(Math.floor(280 / arena.cols), 14, 22)
    : clamp(Math.floor(560 / arena.cols), 22, 36);

  const handleEnter = useCallback((x, y) => setHover({ x, y }), []);
  const handleLeave = useCallback(() => setHover(null), []);

  const hoverTerrain = hover ? getTerrainAt(hover, arena) : null;
  const hoverObjects = hover ? getObjectsAt(hover, arena) : [];
  const hoverUnits   = hover ? (unitsByTile[keyOf(hover.x, hover.y)] || []) : [];
  const hoverIsField = hover ? fieldKeys.has(keyOf(hover.x, hover.y)) : false;
  const hoverInRange = hover ? moveRangeKeys.has(keyOf(hover.x, hover.y)) : false;

  return (
    <div className={"sv-arena-panel cd " + themeCls}>
      <div className="sv-arena-head">
        <div className="sv-arena-title">
          <span className="sv-arena-eyebrow">Battlefield Foundation</span>
          <span className="sv-arena-name">{arena.template?.name || themeLabel}</span>
        </div>
        <div className="sv-arena-meta">
          <span className="sv-arena-tag">{arena.cols}×{arena.rows}</span>
          {field && <span className="sv-arena-tag sv-arena-tag-field">{field.name || "Veilbreak Field"}</span>}
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
            className={"sv-arena-grid" + (moveMode ? " sv-arena-movement-mode" : "") + (targetingMode ? " sv-arena-targeting-mode" : "")}
            style={{
              gridTemplateColumns: `repeat(${arena.cols}, ${tileSize}px)`,
              gridAutoRows: `${tileSize}px`,
            }}
            onMouseLeave={handleLeave}
          >
            {Array.from({ length: arena.rows }).map((_, y) => (
              Array.from({ length: arena.cols }).map((__, x) => {
                const valid = arena.shape[y] && arena.shape[y][x] === 1;
                if (!valid) return <div key={keyOf(x, y)} className="sv-arena-tile sv-arena-tile-void" />;
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
                  targetingMode && objs.length ? "sv-arena-tile-has-object" : "",
                  inField ? "sv-arena-field-overlay" : "",
                  isHover ? "is-hover" : "",
                ].filter(Boolean).join(" ");
                const handleTileClick = () => {
                  if (moveMode && isMoveValid && typeof onTileSelect === "function") {
                    onTileSelect({ x, y });
                    return;
                  }
                  if (targetingMode && isTargetValid && typeof onTargetSelect === "function") {
                    onTargetSelect({ x, y });
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
                    {tileUnits.map(u => (
                      <span
                        key={u.id}
                        className={
                          "sv-arena-unit " +
                          (u.kind === "enemy" ? "is-enemy" : u.kind === "player" ? "is-player" : "is-friend") +
                          (u.isTarget ? " is-target" : "") +
                          (u.kind === "player" && veilbreakReady ? " is-primed" : "")
                        }
                        title={u.label}
                      >
                        <span className="sv-arena-unit-ic">{u.ic || (u.kind === "enemy" ? "👾" : "🗡")}</span>
                        {Number.isFinite(u.hpPct) && (
                          <span className="sv-arena-unit-hp">
                            <span style={{ width: clamp(u.hpPct, 0, 100) + "%" }} />
                          </span>
                        )}
                      </span>
                    ))}
                    {isRare && <span className="sv-arena-rare-glow" aria-hidden="true" />}
                  </div>
                );
              })
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
