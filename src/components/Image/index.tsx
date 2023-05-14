import { Image as AntImage } from 'antd'
import { CheckCircleFilled, EyeFilled, DeleteFilled } from '@ant-design/icons'

interface Props {
  src: string
  previewSrc: string

  onPreview?: () => void
  onSet?: () => void
  onDelete?: () => void
  onVisibleChange?: (value: boolean) => void

  visible: number
  index: number
  style?: React.CSSProperties
  [key: string]: any
}

export function Image({ src, previewSrc, visible, index, style, onPreview, onSet, onDelete, onVisibleChange, ...props }: Props) {
  return (
    <div className=' relative'>
      <img src={src} alt='' style={style} />
      <AntImage
        style={{ display: 'none !important' }}
        src={src}
        preview={{
          visible: visible === index,
          scaleStep: 0.2,
          src: previewSrc,
          onVisibleChange: onVisibleChange,
        }}
      />
      <div className=' absolute top-0 left-0 right-0 bottom-0 opacity-0 hover:opacity-100 flex justify-center flex-row text-center items-center gap-4 bg-black bg-opacity-70'>
        {onPreview && (
          <div onClick={() => onPreview()} className='bg-cyan-500 text-white w-fit p-2 rounded-md shadow-md cursor-pointer grid place-content-center'>
            <EyeFilled style={{ fontSize: '22px' }} />
          </div>
        )}
        {onSet && (
          <div onClick={() => onSet()} className='bg-teal-500 text-white w-fit p-2 rounded-md shadow-md cursor-pointer grid place-content-center'>
            <CheckCircleFilled style={{ fontSize: '22px' }} />
          </div>
        )}
        {onDelete && (
          <div onClick={() => onDelete()} className='bg-red-500  text-white w-fit p-2 rounded-md shadow-md cursor-pointer grid place-content-center'>
            <DeleteFilled style={{ fontSize: '22px' }} />
          </div>
        )}
      </div>
    </div>
  )
}
