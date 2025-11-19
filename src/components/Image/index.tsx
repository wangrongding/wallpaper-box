import { CheckCircleFilled, EyeFilled, DeleteFilled } from '@ant-design/icons'

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
    <div className=' relative'>
      <img src={src} alt='' style={style} loading='lazy' decoding='async' {...props} />
      <div className='absolute bottom-0 left-0 right-0 top-0 flex flex-row items-center justify-center gap-4 bg-black bg-opacity-70 text-center opacity-0 hover:opacity-100'>
        {onPreview && (
          <div
            onClick={() => previewSrc && onPreview(previewSrc)}
            className='grid w-fit cursor-pointer place-content-center rounded-md bg-cyan-500 p-2 text-white shadow-md'
          >
            <EyeFilled style={{ fontSize: '22px' }} />
          </div>
        )}
        {onSet && (
          <div onClick={() => onSet()} className='grid w-fit cursor-pointer place-content-center rounded-md bg-teal-500 p-2 text-white shadow-md'>
            <CheckCircleFilled style={{ fontSize: '22px' }} />
          </div>
        )}
        {onDelete && (
          <div onClick={() => onDelete()} className='grid  w-fit cursor-pointer place-content-center rounded-md bg-red-500 p-2 text-white shadow-md'>
            <DeleteFilled style={{ fontSize: '22px' }} />
          </div>
        )}
      </div>
    </div>
  )
}
