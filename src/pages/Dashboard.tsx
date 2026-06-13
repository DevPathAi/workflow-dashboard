import { useData } from '../hooks/useData'
import Header from '../components/Header'
import TrackCard from '../components/TrackCard'
import ProgressTable from '../components/ProgressTable'
import TimelineChart from '../components/TimelineChart'

export default function Dashboard() {
  const { data, loading, overallPercent } = useData()

  if (loading) return <div className="p-8 text-stone-400">Loading...</div>

  const trackEntries = data.flatMap(d => {
    if (d.tracks.length > 1 && d.tracks[0].owner === d.tracks[1]?.owner) {
      return [{ repoData: d, trackName: d.repo, owner: d.tracks[0].owner }]
    }
    return d.tracks.map(t => ({ repoData: d, trackName: t.name, owner: t.owner }))
  })

  return (
    <div className="min-h-screen bg-stone-50">
      <Header overallPercent={overallPercent} />

      {overallPercent === 0 && (
        <div className="mx-6 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          아직 시작 전입니다 — 모든 트랙이 계획 단계로 진행률 0%입니다.
          각 서비스가 작업을 진행하고 <code className="bg-amber-100 px-1 rounded">sync</code>로 갱신하면 수치가 채워집니다.
        </div>
      )}

      <div className="px-6 py-4">
        <h2 className="text-sm font-semibold text-stone-600 mb-2">트랙별 현황</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {trackEntries.map(e => (
            <TrackCard key={e.trackName} {...e} />
          ))}
        </div>
      </div>

      <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProgressTable data={data} />
        <TimelineChart data={data} />
      </div>
    </div>
  )
}
