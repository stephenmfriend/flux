import { route } from 'preact-router'

type LaneStats = { planning: number; todo: number; in_progress: number; done: number }

interface BetCardProps {
  projectId: string
  epicId: string
  epicTitle: string
  status: string
  auto: boolean
  stats: LaneStats
  lastEvent?: string
}

export function BetCard({ projectId, epicId, epicTitle, status, auto, stats, lastEvent }: BetCardProps) {
  // Match ProjectCard proportions
  const totalItems = (stats.planning + stats.todo + stats.in_progress) !== 0 ? (stats.planning + stats.todo + stats.in_progress) : 1
  const getPercent = (val: number) => Math.max(5, Math.min(100, (val / totalItems) * 100))

  const statusColor =
    status === 'done' ? 'text-[#3ecf8e]' :
      status === 'in_progress' ? 'text-amber-500' :
        'text-text-medium'

  const glowClass =
    status === 'done' ? 'hover:shadow-[0_0_20px_-5px_rgba(62,207,142,0.2)] hover:border-[#3ecf8e]/30' :
      status === 'in_progress' ? 'shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)] border-amber-500/30' :
        'hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.05)]'

  return (
    <div
      onClick={() => route(`/bet/${projectId}/${epicId}`)}
      className={`
        group relative flex flex-col p-5 rounded-xl border border-border-subtle bg-[#1A1A1A]
        cursor-pointer transition-all duration-300 ${glowClass}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-white group-hover:text-[#3ecf8e] transition-colors tracking-tight">
            {epicTitle}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${statusColor === 'text-[#3ecf8e]' ? 'bg-[#3ecf8e]' : statusColor === 'text-amber-500' ? 'bg-amber-500' : 'bg-border-subtle'}`}></span>
            <span className={`text-xs font-medium uppercase tracking-wider ${statusColor}`}>
              {status.replace('_', ' ')}
            </span>
            <span className="text-border-subtle">•</span>
            <span className="text-xs text-text-medium font-medium">{auto ? 'Auto: On' : 'Auto: Off'}</span>
          </div>
        </div>

        {/* Right badge mirrors ProjectCard's badge */}
        <div className={`
          px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
          ${status === 'in_progress' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
              status === 'done' ? 'bg-[#3ecf8e]/10 text-[#3ecf8e] border-[#3ecf8e]/20' :
                'bg-bg-surface text-text-medium border-border-subtle'}
        `}>
          {status.replace('_', ' ')}
        </div>
      </div>

      {/* Metrics Grid (same rhythm as Projects) */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-medium w-16 font-medium">Shaping</span>
          <div className="flex-1 h-1.5 bg-bg-surface rounded-full overflow-hidden">
            <div className="h-full bg-text-medium/40 rounded-full" style={{ width: `${getPercent(stats.planning)}%` }}></div>
          </div>
          <span className="text-xs text-text-high font-mono w-6 text-right">{stats.planning}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-text-medium w-16 font-medium">Betting</span>
          <div className="flex-1 h-1.5 bg-bg-surface rounded-full overflow-hidden">
            <div className="h-full bg-amber-500/80 rounded-full" style={{ width: `${getPercent(stats.todo)}%` }}></div>
          </div>
          <span className="text-xs text-text-high font-mono w-6 text-right">{stats.todo}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-text-medium w-16 font-medium">Building</span>
          <div className="flex-1 h-1.5 bg-bg-surface rounded-full overflow-hidden">
            <div className="h-full bg-[#3ecf8e] rounded-full shadow-[0_0_8px_rgba(62,207,142,0.4)]" style={{ width: `${getPercent(stats.in_progress)}%` }}></div>
          </div>
          <span className="text-xs text-text-high font-mono w-6 text-right">{stats.in_progress}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-border-subtle/50 flex items-center justify-end">
        <div className="flex items-center gap-2">
          <span className="task-id">#{epicId}</span>
          <span className="text-[11px] text-text-medium/70 truncate max-w-[120px]">
            {lastEvent && lastEvent !== '' ? lastEvent : 'No recent activity'}
          </span>
        </div>
      </div>
    </div>
  )
}
