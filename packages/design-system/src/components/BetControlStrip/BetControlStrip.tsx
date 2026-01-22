import { h } from 'preact'
import './BetControlStrip.css'

export interface BetControlStripProps {
  betScope: string
  scopeCutBadges?: string[]
  appetite: string
  currentDay: number
  totalDays: number
  hillState: number // 0-100
  scopeCutsCount: number
  onHistoryClick?: () => void
  onCutScopeClick?: () => void
  onEditBetClick?: () => void
}

export function BetControlStrip({
  betScope,
  scopeCutBadges = [],
  appetite,
  currentDay,
  totalDays,
  hillState,
  scopeCutsCount,
  onHistoryClick,
  onCutScopeClick,
  onEditBetClick
}: BetControlStripProps) {
  return (
    <div className="bet-control-strip">
      {/* 1. Bet Scope */}
      <div className="bet-info-group" style={{ flex: 1 }}>
        <div className="bet-label">Bet Scope</div>
        <div className="bet-scope-text">
          {betScope}
          {scopeCutBadges.map((badge, i) => (
            <span key={i} className="scope-cut-badge">{badge}</span>
          ))}
        </div>
      </div>

      <div className="bet-separator"></div>

      {/* 2. Appetite */}
      <div className="bet-info-group" style={{ minWidth: '140px' }}>
        <div className="bet-label">Appetite</div>
        <div className="bet-value">
          {appetite} <span className="day-tracker">| Day {currentDay} of {totalDays}</span>
        </div>
      </div>

      <div className="bet-separator"></div>

      {/* 3. Hill State (Slider) */}
      <div className="bet-info-group" style={{ minWidth: '200px' }}>
        <div className="bet-label">Hill State</div>
        <div className="hill-slider-container">
          <span className="hill-label-left">Figuring out</span>
          <div className="hill-track">
            <div className="hill-progress" style={{ width: `${hillState}%` }}></div>
            <div className="hill-handle" style={{ left: `${hillState}%` }}></div>
          </div>
          <span className="hill-label-right">Executing</span>
        </div>
      </div>

      <div className="bet-separator"></div>

      {/* 4. Scope cuts */}
      <div className="bet-info-group">
        <div className="bet-label">Scope cuts</div>
        <div className="bet-value">{scopeCutsCount}</div>
      </div>

      {/* History Button */}
      <button className="bet-btn" onClick={onHistoryClick} style={{ marginLeft: '8px' }}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        History
      </button>

      <div style={{ flex: 1 }}></div>

      {/* 5. Cut Scope */}
      <button className="bet-btn" onClick={onCutScopeClick}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M6 3v12" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
        Cut Scope
      </button>

      {/* Edit Bet */}
      <button className="bet-btn" onClick={onEditBetClick}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        Edit Bet
      </button>
    </div>
  )
}
