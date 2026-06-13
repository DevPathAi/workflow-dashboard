import { useConfig } from '../hooks/useConfig'

interface HeaderProps {
  overallPercent: number
  subtitle?: string
  backLink?: string
}

export default function Header({ overallPercent, subtitle, backLink }: HeaderProps) {
  const { config } = useConfig()
  const projectName = config?.project?.name || 'Dashboard'

  return (
    <header className="bg-gradient-to-r from-stone-900 to-stone-800 px-4 sm:px-6 py-4 sm:py-5 flex flex-wrap justify-between items-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {backLink && (
          <>
            <a href={backLink} className="text-stone-400 hover:text-amber text-sm whitespace-nowrap">← 대시보드</a>
            <div className="w-px h-5 bg-stone-700" />
          </>
        )}
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-amber font-display m-0 truncate">{projectName}</h1>
          <p className="text-xs text-stone-300 truncate">{subtitle || 'Workflow Dashboard'}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-6 shrink-0">
        <a href="#/settings" className="text-stone-400 hover:text-amber-light text-sm transition-colors whitespace-nowrap">⚙ Settings</a>
        <div className="text-right">
          <div className="text-3xl sm:text-4xl font-bold text-amber-light font-display">{overallPercent}%</div>
          <p className="text-xs text-stone-400 whitespace-nowrap">전체 진행률</p>
        </div>
      </div>
    </header>
  )
}
