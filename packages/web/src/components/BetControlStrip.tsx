import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import './BetControlStrip.css';

export interface BetControlStripProps {
  betScope: string;
  scopeCuts?: { text: string; timestamp: string }[];
  appetite: string;
  currentDay: number;
  totalDays: number;
  hillState: number; // 0-100 representing position on the hill
  scopeCutsCount: number;
  onHistoryClick?: () => void;
  onCutScopeClick?: () => void;
  onEditBetClick?: () => void;
  onHillStateChange?: (value: number) => void;
}

export function BetControlStrip({
  betScope,
  scopeCuts = [],
  appetite,
  currentDay,
  totalDays,
  hillState,
  scopeCutsCount,
  onHistoryClick,
  onCutScopeClick,
  onEditBetClick,
  onHillStateChange,
}: BetControlStripProps): JSX.Element {
  const [isDragging, setIsDragging] = useState(false);

  const handleHillDrag = (e: MouseEvent | TouchEvent): void => {
    if (!isDragging) return;

    const slider = (e.currentTarget as HTMLElement).querySelector('.hill-slider-track-container');
    if (slider === null) return;

    const rect = slider.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = Math.round((x / rect.width) * 100);

    onHillStateChange?.(percentage);
  };

  const startDrag = (): void => {
    setIsDragging(true);
  };

  const stopDrag = (): void => {
    setIsDragging(false);
  };

  return (
    <div className="bet-control-strip">
      {/* Bet Scope Section */}
      <div className="bet-info-group" style={{ flex: 1 }}>
        <div className="bet-label">Bet Scope</div>
        <div className="bet-scope-text">
          {betScope}
          {scopeCuts.map((cut, idx) => (
            <span
              key={idx}
              className="scope-cut-badge"
              style={{
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '2px 6px',
                borderRadius: '4px',
                marginLeft: idx === 0 ? '4px' : '2px',
              }}
            >
              {cut.text}
            </span>
          ))}
        </div>
      </div>

      <div className="bet-separator" />

      {/* Appetite Section */}
      <div className="bet-info-group" style={{ minWidth: '140px' }}>
        <div className="bet-label">Appetite</div>
        <div className="bet-value">
          {appetite}{' '}
          <span style={{ color: 'var(--text-medium)', marginLeft: '4px', fontWeight: 400, fontSize: '12px' }}>
            | Day {currentDay} of {totalDays}
          </span>
        </div>
      </div>

      <div className="bet-separator" />

      {/* Hill State Section */}
      <div className="bet-info-group" style={{ minWidth: '200px' }}>
        <div className="bet-label">Hill State</div>
        <div
          className="hill-slider-container"
          onMouseMove={handleHillDrag}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          onTouchMove={handleHillDrag}
          onTouchEnd={stopDrag}
        >
          <span style={{ fontSize: '10px', color: 'var(--text-medium)' }}>Figuring out</span>
          <div style={{ flex: 1, height: '4px', background: 'var(--border-default)', borderRadius: '2px', position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${hillState}%`,
                background: 'var(--brand-primary)',
                borderRadius: '2px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: `${hillState}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '12px',
                height: '12px',
                background: 'var(--text-high)',
                border: '2px solid var(--brand-primary)',
                borderRadius: '50%',
                cursor: isDragging ? 'grabbing' : 'grab',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
              onMouseDown={startDrag}
              onTouchStart={startDrag}
            />
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-medium)' }}>Executing</span>
        </div>
      </div>

      <div className="bet-separator" />

      {/* Scope Cuts Section */}
      <div className="bet-info-group">
        <div className="bet-label">Scope cuts</div>
        <div className="bet-value">{scopeCutsCount}</div>
      </div>

      {/* History Button */}
      <button
        className="button-with-icon"
        onClick={onHistoryClick}
        style={{ marginLeft: '8px' }}
        type="button"
        aria-label="View history"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        History
      </button>

      <div style={{ flex: 1 }} />

      {/* Cut Scope Button */}
      <button
        className="button-with-icon"
        onClick={onCutScopeClick}
        type="button"
        aria-label="Cut scope"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M6 3v12" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
        Cut Scope
      </button>

      {/* Edit Bet Button */}
      <button
        className="button-with-icon"
        onClick={onEditBetClick}
        type="button"
        aria-label="Edit bet"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        Edit Bet
      </button>
    </div>
  );
}
