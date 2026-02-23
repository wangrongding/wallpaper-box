import { Monitor, Eye, Trash2 } from 'lucide-react'

interface Props {
  src: string
  previewSrc?: string
  index: number

  onPreview?: (path: string) => void
  onSet?: () => void
  onDelete?: () => void
  onVisibleChange?: (value: boolean) => void
  style?: React.CSSProperties
  [key: string]: any
}

export function Image({ src, previewSrc, index, style, onPreview, onSet, onDelete, ...props }: Props) {
  return (
    <div style={style} className='group relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-glass)] transition-all duration-300 hover:border-[var(--border-accent)] hover:shadow-[var(--shadow-glow)]'>
      <img
        src={src}
        alt=''
        loading='lazy'
        decoding='async'
        className='block w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]'
        {...props}
      />
      <div className='absolute inset-0 flex items-center justify-center gap-2.5 bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100'>
        {onPreview && (
          <button
            onClick={() => previewSrc && onPreview(previewSrc)}
            className='flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/90 backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white/20 hover:text-white'
          >
            <Eye className='h-4 w-4' />
          </button>
        )}
        {onSet && (
          <button
            onClick={() => onSet()}
            className='flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/80 text-white shadow-lg shadow-emerald-500/20 backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-emerald-500 hover:shadow-emerald-500/30'
          >
            <Monitor className='h-4 w-4' />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete()}
            className='flex h-9 w-9 items-center justify-center rounded-full border border-red-400/20 bg-red-500/80 text-white shadow-lg shadow-red-500/20 backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-red-500 hover:shadow-red-500/30'
          >
            <Trash2 className='h-4 w-4' />
          </button>
        )}
      </div>
    </div>
  )
}
