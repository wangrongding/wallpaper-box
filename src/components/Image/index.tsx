import { CheckCircle, Eye, Trash2 } from 'lucide-react'

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
    <div className='group relative overflow-hidden rounded-lg'>
      <img
        src={src}
        alt=''
        style={style}
        loading='lazy'
        decoding='async'
        className='w-full transition-transform duration-300 group-hover:scale-105'
        {...props}
      />
      <div className='absolute inset-0 flex items-center justify-center gap-3 bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
        {onPreview && (
          <button
            onClick={() => previewSrc && onPreview(previewSrc)}
            className='grid place-content-center rounded-lg bg-cyan-500 p-2.5 text-white shadow-md transition-transform hover:scale-110 hover:bg-cyan-400'
          >
            <Eye className='h-5 w-5' />
          </button>
        )}
        {onSet && (
          <button
            onClick={() => onSet()}
            className='grid place-content-center rounded-lg bg-teal-500 p-2.5 text-white shadow-md transition-transform hover:scale-110 hover:bg-teal-400'
          >
            <CheckCircle className='h-5 w-5' />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete()}
            className='grid place-content-center rounded-lg bg-red-500 p-2.5 text-white shadow-md transition-transform hover:scale-110 hover:bg-red-400'
          >
            <Trash2 className='h-5 w-5' />
          </button>
        )}
      </div>
    </div>
  )
}
