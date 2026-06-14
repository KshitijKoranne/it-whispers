'use client';

import { type CSSProperties } from 'react';
import { GameState } from '@/lib/game/types';
import { formatGameTime } from '@/lib/game/state';

interface ResourcePanelProps {
  state: GameState;
}

export function ResourcePanel({ state }: ResourcePanelProps) {
  const {
    player,
    resources,
    lightSystem,
    timeOfNightMinutes,
    nightPhase,
    repetition,
    flags,
    progress,
  } = state;

  const hasLitCandle = flags['hasLitFirstCandle'] === true;
  const lanternLit = flags['lanternLit'] === true;
  const isLit = lightSystem.lightLevel > 0;
  const turns = lightSystem.candleTurnsRemaining;

  // ── Light status label ─────────────────────────────────────
  let candleLabel: string;
  let candleColor = '#666666';

  if (lanternLit) {
    if (turns > 20) {
      candleLabel = 'lanternlight — steady';
    } else if (turns <= 3) {
      candleLabel = `lanternlight — ${turns} turns`;
      candleColor = '#8a6a30';
    } else {
      candleLabel = `lanternlight — ${turns} turns`;
    }
    candleColor = candleColor ?? '#c8922a';
  } else if (!hasLitCandle) {
    candleLabel = 'darkness';
    candleColor = '#666666';
  } else if (!isLit) {
    candleLabel = 'out';
    candleColor = '#7a3535';
  } else if (turns === 1) {
    candleLabel = `guttering — 1 turn`;
    candleColor = '#a04040';
  } else if (turns <= 3) {
    candleLabel = `weak — ${turns} turns`;
    candleColor = '#8a6a30';
  } else {
    const conditionLabel = lightSystem.lightLevel === 2 ? 'steady' : 'weak candle';
    candleLabel = `${conditionLabel} — ${turns} turns`;
    candleColor = '#c8922a';
  }

  // ── Resource rows ──────────────────────────────────────────
  // Exclude items shown as flags or with no carried-count meaning
  const EXCLUDE_FROM_CARRIED = new Set([
    'namesKnownCount',
    'keeperNote',
    'cemeteryMap',
    'buriedLedgerPage',
  ]);
  const nonZeroResources = Object.entries(resources)
    .filter(([key, value]) => value > 0 && !EXCLUDE_FROM_CARRIED.has(key))
    .map(([key, value]) => ({ key, label: formatResourceName(key), value }));

  // Items shown as flags, not counts
  const hasCemeteryMap = (resources.cemeteryMap ?? 0) >= 1;
  const hasKeeperNote = (resources.keeperNote ?? 0) >= 1;
  const hasBuriedLedgerPage = (resources.buriedLedgerPage ?? 0) >= 1;

  const hasCarried =
    nonZeroResources.length > 0 || hasCemeteryMap || hasKeeperNote || hasBuriedLedgerPage;

  const woundsHigh = player.wounds > 0;

  const panel: CSSProperties = {
    background: '#0f0f0f',
    border: '1px solid #1e1e1e',
    padding: '1.2rem 1.1rem',
    fontFamily: 'var(--font-prose)',
  };

  const sectionLabel: CSSProperties = {
    fontSize: '0.8125rem',
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: '#606060',
    marginBottom: '0.8rem',
  };

  const row: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '0.55rem',
  };

  const keyStyle: CSSProperties = {
    fontSize: '0.9375rem',
    color: '#787878',
    letterSpacing: '0.02em',
  };

  const valStyle: CSSProperties = {
    fontSize: '0.9375rem',
    color: '#c8bfaf',
    letterSpacing: '0.04em',
  };

  const divider: CSSProperties = {
    height: '1px',
    background: '#191919',
    margin: '0.9rem 0',
  };

  // Chapter 1 observed
  const showListenCount = repetition.firstGraveListenCount > 0;
  const showMarkerProgress =
    repetition.firstGraveMarkerProgress > 0 && repetition.firstGraveMarkerProgress < 4;
  const hasChapter1Observed = showListenCount || showMarkerProgress;

  // Chapter 2 observed
  const inChapter2 = flags['chapter2Active'] === true && !flags['chapter2Complete'];
  const ledgerCount = progress['ledgerReadCount'] ?? 0;
  const cleanProgress = progress['cleanLanternProgress'] ?? 0;
  const mapCount = progress['mapStudyCount'] ?? 0;
  const showLedger = inChapter2 && ledgerCount > 0;
  const showCleanProgress = inChapter2 && cleanProgress > 0 && cleanProgress < 3;
  const showMapProgress = inChapter2 && mapCount > 0;
  const hasChapter2Observed = showLedger || showCleanProgress || showMapProgress;

  // Chapter 3 observed
  const inChapter3 = flags['chapter3Active'] === true && !flags['firstArcComplete'];
  const digProgress = progress['digProgress'] ?? 0;
  const readMarkerProgress = progress['readMarkerProgress'] ?? 0;
  const showDigProgress = inChapter3 && digProgress > 0 && digProgress < 4;
  const showMarkerReadProgress = inChapter3 && readMarkerProgress > 0 && readMarkerProgress < 3;
  const hasChapter3Observed = showDigProgress || showMarkerReadProgress;

  // Chapter 4 observed
  const inChapter4 = flags['chapter4Active'] === true && !flags['chapter4Complete'];
  const blankStoneTraceProgress = repetition.blankStoneTraceProgress ?? 0;
  const namelessRowListenCount = repetition.namelessRowListenCount ?? 0;
  const blackSaltWardStrength = repetition.blackSaltWardStrength ?? 0;
  const uncarvedPlotInspectCount = repetition.uncarvedPlotInspectCount ?? 0;
  const ashBasinSearchCount = repetition.ashBasinSearchCount ?? 0;
  const livingTraceListenCount = repetition.livingTraceListenCount ?? 0;
  const showBlankStoneTrace = inChapter4 && blankStoneTraceProgress > 0 && blankStoneTraceProgress < 3;
  const showNamelessListen = inChapter4 && namelessRowListenCount > 0;
  const showBlackSaltWard = inChapter4 && blackSaltWardStrength > 0;
  const showUncarvedPlot = inChapter4 && uncarvedPlotInspectCount > 0;
  const showAshBasin = inChapter4 && ashBasinSearchCount > 0;
  const showLivingTrace = inChapter4 && livingTraceListenCount > 0;
  const hasChapter4Observed =
    showBlankStoneTrace ||
    showNamelessListen ||
    showBlackSaltWard ||
    showUncarvedPlot ||
    showAshBasin ||
    showLivingTrace;

  const lightLabel = lanternLit ? 'lantern' : 'candle';

  return (
    <div style={panel}>
      <div style={sectionLabel}>status</div>

      <div style={row}>
        <span style={keyStyle}>time</span>
        <span style={valStyle}>{formatGameTime(timeOfNightMinutes)}</span>
      </div>
      <div style={row}>
        <span style={keyStyle}>phase</span>
        <span style={valStyle}>{nightPhase}</span>
      </div>

      <div style={divider} />

      <div style={row}>
        <span style={keyStyle}>courage</span>
        <span style={valStyle}>
          {player.courage} / {player.maxCourage}
        </span>
      </div>
      <div style={row}>
        <span style={keyStyle}>wounds</span>
        <span style={{ ...valStyle, color: woundsHigh ? '#a04040' : '#c8bfaf' }}>
          {player.wounds} / {player.maxWounds}
        </span>
      </div>

      {/* Light status */}
      <div style={row}>
        <span style={keyStyle}>{lightLabel}</span>
        <span
          style={{
            ...valStyle,
            color: candleColor,
            fontStyle: !isLit && hasLitCandle && !lanternLit ? 'italic' : 'normal',
          }}
        >
          {candleLabel}
        </span>
      </div>

      {/* Carried items */}
      {hasCarried && (
        <>
          <div style={divider} />
          <div style={{ ...sectionLabel, marginBottom: '0.8rem' }}>carried</div>
          {nonZeroResources.map(({ key, label, value }) => (
            <div key={key} style={row}>
              <span style={keyStyle}>{label}</span>
              <span style={valStyle}>{value}</span>
            </div>
          ))}
          {hasCemeteryMap && (
            <div style={row}>
              <span style={keyStyle}>cemetery map</span>
              <span style={{ ...valStyle, color: '#888888' }}>yes</span>
            </div>
          )}
          {hasKeeperNote && (
            <div style={row}>
              <span style={keyStyle}>keeper note</span>
              <span style={{ ...valStyle, color: '#888888' }}>yes</span>
            </div>
          )}
          {hasBuriedLedgerPage && (
            <div style={row}>
              <span style={keyStyle}>buried ledger page</span>
              <span style={{ ...valStyle, color: '#888888' }}>yes</span>
            </div>
          )}
        </>
      )}

      {/* Observed: Chapter 1 */}
      {hasChapter1Observed && (
        <>
          <div style={divider} />
          <div style={{ ...sectionLabel, marginBottom: '0.8rem' }}>observed</div>
          {showListenCount && (
            <div style={row}>
              <span style={keyStyle}>first grave</span>
              <span style={{ ...valStyle, color: '#666666' }}>
                listened ×{repetition.firstGraveListenCount}
              </span>
            </div>
          )}
          {showMarkerProgress && (
            <div style={row}>
              <span style={keyStyle}>marker</span>
              <span style={{ ...valStyle, color: '#666666' }}>
                {repetition.firstGraveMarkerProgress} / 4
              </span>
            </div>
          )}
        </>
      )}

      {/* Observed: Chapter 2 */}
      {hasChapter2Observed && (
        <>
          <div style={divider} />
          <div style={{ ...sectionLabel, marginBottom: '0.8rem' }}>observed</div>
          {showLedger && (
            <div style={row}>
              <span style={keyStyle}>ledger</span>
              <span style={{ ...valStyle, color: '#666666' }}>{ledgerCount} / 5 fragments</span>
            </div>
          )}
          {showCleanProgress && (
            <div style={row}>
              <span style={keyStyle}>lantern</span>
              <span style={{ ...valStyle, color: '#666666' }}>cleaned {cleanProgress} / 3</span>
            </div>
          )}
          {showMapProgress && (
            <div style={row}>
              <span style={keyStyle}>map</span>
              <span style={{ ...valStyle, color: '#666666' }}>studied {mapCount} / 3</span>
            </div>
          )}
        </>
      )}

      {/* Observed: Chapter 3 */}
      {hasChapter3Observed && (
        <>
          <div style={divider} />
          <div style={{ ...sectionLabel, marginBottom: '0.8rem' }}>observed</div>
          {showDigProgress && (
            <div style={row}>
              <span style={keyStyle}>dig</span>
              <span style={{ ...valStyle, color: '#666666' }}>progress {digProgress} / 4</span>
            </div>
          )}
          {showMarkerReadProgress && (
            <div style={row}>
              <span style={keyStyle}>marker read</span>
              <span style={{ ...valStyle, color: '#666666' }}>{readMarkerProgress} / 3</span>
            </div>
          )}
        </>
      )}

      {/* Observed: Chapter 4 */}
      {hasChapter4Observed && (
        <>
          <div style={divider} />
          <div style={{ ...sectionLabel, marginBottom: '0.8rem' }}>observed</div>
          {showNamelessListen && (
            <div style={row}>
              <span style={keyStyle}>nameless row</span>
              <span style={{ ...valStyle, color: '#666666' }}>
                listened ×{namelessRowListenCount}
              </span>
            </div>
          )}
          <div style={row}>
            <span style={keyStyle}>blank stones</span>
            <span style={{ ...valStyle, color: '#666666' }}>
              traced {blankStoneTraceProgress} / 3
            </span>
          </div>
          {showBlackSaltWard && (
            <div style={row}>
              <span style={keyStyle}>black salt</span>
              <span style={{ ...valStyle, color: '#666666' }}>warded ×{blackSaltWardStrength}</span>
            </div>
          )}
          {showUncarvedPlot && (
            <div style={row}>
              <span style={keyStyle}>uncarved plot</span>
              <span style={{ ...valStyle, color: '#666666' }}>
                inspected {uncarvedPlotInspectCount} / 3
              </span>
            </div>
          )}
          {showAshBasin && (
            <div style={row}>
              <span style={keyStyle}>ash basin</span>
              <span style={{ ...valStyle, color: '#666666' }}>searched ×{ashBasinSearchCount}</span>
            </div>
          )}
          {showLivingTrace && (
            <div style={row}>
              <span style={keyStyle}>living trace</span>
              <span style={{ ...valStyle, color: '#666666' }}>
                listened ×{livingTraceListenCount}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function formatResourceName(key: string): string {
  const names: Record<string, string> = {
    candle: 'candle',
    wax: 'wax',
    matches: 'matches',
    oil: 'oil',
    salt: 'salt',
    ironNails: 'iron nails',
    rations: 'rations',
    cloth: 'cloth',
    boneTokens: 'bone tokens',
    namesKnownCount: 'names known',
    // Chapter 2
    rag: 'rag',
    twine: 'twine',
    crackedLantern: 'cracked lantern',
    handSpade: 'hand spade',
    cemeteryMap: 'cemetery map',
    keeperNote: 'keeper note',
    // Chapter 3
    markerFragment: 'marker fragment',
    secondNameFragment: 'name fragment',
    clothStrip: 'cloth strip',
    buriedLedgerPage: 'buried ledger page',
    // Chapter 4
    graveChalk: 'grave chalk',
    graveRubbings: 'grave rubbings',
    blackSalt: 'black salt',
    keeperThread: 'keeper thread',
    unwrittenLedgerPage: 'unwritten ledger page',
    stitchedLedgerPage: 'stitched ledger page',
    livingNameTrace: 'living name trace',
    livingNameAnchor: 'living name anchor',
  };
  return names[key] ?? key;
}
