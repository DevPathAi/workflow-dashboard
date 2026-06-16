import { useConfig } from '../hooks/useConfig'

interface Props {
  selected: string
  onChange: (week: string) => void
}

export default function WeekTabs({ selected, onChange }: Props) {
  const { config } = useConfig()
  const weeks = config?.periods?.map(p => p.id) || ['DONE', 'MD1', 'MD2', 'MD3', 'MD4']

  return (
    <div className="flex bg-stone-800 px-6 overflow-x-auto">
      {weeks.map(w => (
        <button
          key={w}
          onClick={() => onChange(w)}
          className={`px-4 py-2.5 text-xs font-medium transition-colors shrink-0 ${
            w === selected
              ? 'text-amber border-b-2 border-amber'
              : 'text-stone-400 hover:text-stone-300'
          }`}
        >
          {w}
        </button>
      ))}
    </div>
  )
}
