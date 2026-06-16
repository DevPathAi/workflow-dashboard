import { useNavigate } from 'react-router-dom'
import type { RepoData } from '../types'
import { progressBorder, progressText, progressBg } from '../utils/progressColor'
import { useConfig } from '../hooks/useConfig'

interface TrackCardProps {
  repoData: RepoData
  trackName: string
  owner: string
  color: string
}

export default function TrackCard({ repoData, trackName, owner, color }: TrackCardProps) {
  const navigate = useNavigate()
  const { config } = useConfig()
  const track = repoData.tracks.find(t => t.name === trackName)
  const isCombined = !track && repoData.tracks.length > 0

  if (!track && !isCombined) return null

  const totalChecks = isCombined
    ? repoData.tracks.reduce((s, t) => s + t.weeks.reduce((ws, w) => ws + w.totalChecks, 0), 0)
    : track!.weeks.reduce((s, w) => s + w.totalChecks, 0)
  const doneChecks = isCombined
    ? repoData.tracks.reduce((s, t) => s + t.weeks.reduce((ws, w) => ws + w.doneChecks, 0), 0)
    : track!.weeks.reduce((s, w) => s + w.doneChecks, 0)
  const percent = totalChecks > 0 ? Math.round(doneChecks / totalChecks * 100) : 0

  // For combined sparkline, merge per-period totals across all tracks
  const WEEKS = config?.periods?.map(p => p.id) || ['DONE', 'MD1', 'MD2', 'MD3', 'MD4']
  const weeklyData = isCombined
    ? WEEKS.map(w => {
        const tc = repoData.tracks.reduce((s, t) => s + (t.weeks.find(wk => wk.week === w)?.totalChecks || 0), 0)
        const dc = repoData.tracks.reduce((s, t) => s + (t.weeks.find(wk => wk.week === w)?.doneChecks || 0), 0)
        return { week: w, totalChecks: tc, doneChecks: dc }
      })
    : track!.weeks

  const hasData = totalChecks > 0

  return (
    <div
      onClick={() => navigate(`/detail/${repoData.repo}`)}
      className={`bg-white border-2 ${!hasData ? 'border-stone-200' : progressBorder(percent)} rounded-xl p-4 text-center cursor-pointer
        hover:shadow-lg transition-shadow`}
    >
      <div className={`text-3xl font-bold font-display ${!hasData ? 'text-stone-500' : progressText(percent)}`}>
        {percent}%
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-1">
        <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-xs font-semibold text-stone-700">{trackName}</span>
      </div>
      <div className="text-xs text-stone-500">{owner}</div>
      <div className="mt-2 h-1.5 bg-stone-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${progressBg(percent)}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex gap-0.5 mt-2 items-end h-5" title={`단계별 진행률 (${weeklyData.length}개 단계, 좌→우 = DONE→MD4)`}>
        {weeklyData.map(w => {
          const wp = w.totalChecks > 0 ? Math.round(w.doneChecks / w.totalChecks * 100) : 0
          return (
            <div
              key={w.week}
              className={`flex-1 min-w-0 rounded-sm ${wp > 0 ? progressBg(wp) : 'bg-stone-200'}`}
              style={{ height: `${Math.max(4, wp * 0.2)}px` }}
              title={`${w.week}: ${wp}%`}
            />
          )
        })}
      </div>
    </div>
  )
}
