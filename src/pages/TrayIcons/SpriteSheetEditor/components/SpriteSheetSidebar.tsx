import { rangeInputClassName } from '../constants'
import type { GridNumberKey, GridSettings, TransparentSettings } from '../types'
import ControlSection from './ControlSection'
import NumberSliderField from './NumberSliderField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Grid3X3, Palette, RefreshCw, Timer } from 'lucide-react'

type SpriteSheetSidebarProps = {
  frameHeightMax: number
  frameWidthMax: number
  gapMax: number
  gridSettings: GridSettings
  iconName: string
  imageLoaded: boolean
  maxGridFrames: number
  offsetXMax: number
  offsetYMax: number
  onApplyAutoGrid: () => void
  onGridDecimalChange: (key: GridNumberKey, value: string, min: number, max: number) => void
  onGridNumberChange: (key: GridNumberKey, value: string, min: number, max: number) => void
  onIconNameChange: (value: string) => void
  onTransparentColorChange: (value: string) => void
  onTransparentEnabledChange: (value: boolean) => void
  onTransparentToleranceChange: (value: string) => void
  transparentSettings: TransparentSettings
}

export default function SpriteSheetSidebar({
  frameHeightMax,
  frameWidthMax,
  gapMax,
  gridSettings,
  iconName,
  imageLoaded,
  maxGridFrames,
  offsetXMax,
  offsetYMax,
  onApplyAutoGrid,
  onGridDecimalChange,
  onGridNumberChange,
  onIconNameChange,
  onTransparentColorChange,
  onTransparentEnabledChange,
  onTransparentToleranceChange,
  transparentSettings,
}: SpriteSheetSidebarProps) {
  return (
    <aside className='bg-black/[0.12]'>
      <ControlSection icon={<Grid3X3 className='h-4 w-4' />} title='网格'>
        <label className='mb-3 block'>
          <span className='mb-1 block text-[12px] text-[var(--text-tertiary)]'>图标名称</span>
          <Input
            value={iconName}
            placeholder='例如：green-dragon'
            className='bg-black/20'
            onChange={(event) => onIconNameChange(event.target.value)}
          />
        </label>

        <div className='grid grid-cols-2 gap-2'>
          <NumberSliderField
            label='帧数'
            min={1}
            max={maxGridFrames}
            step={1}
            value={gridSettings.frameCount}
            onChange={(value) => onGridNumberChange('frameCount', value, 1, maxGridFrames)}
          />
          <NumberSliderField
            label='列'
            min={1}
            max={24}
            step={1}
            value={gridSettings.columns}
            onChange={(value) => onGridNumberChange('columns', value, 1, 24)}
          />
          <NumberSliderField
            label='行'
            min={1}
            max={24}
            step={1}
            value={gridSettings.rows}
            onChange={(value) => onGridNumberChange('rows', value, 1, 24)}
          />
          <NumberSliderField
            label='帧宽'
            min={1}
            max={frameWidthMax}
            step='any'
            suffix='px'
            value={gridSettings.frameWidth}
            onChange={(value) => onGridDecimalChange('frameWidth', value, 1, frameWidthMax)}
          />
          <NumberSliderField
            label='帧高'
            min={1}
            max={frameHeightMax}
            step='any'
            suffix='px'
            value={gridSettings.frameHeight}
            onChange={(value) => onGridDecimalChange('frameHeight', value, 1, frameHeightMax)}
          />
          <NumberSliderField
            label='X 起点'
            min={0}
            max={offsetXMax}
            step='any'
            suffix='px'
            value={gridSettings.offsetX}
            onChange={(value) => onGridDecimalChange('offsetX', value, 0, offsetXMax)}
          />
          <NumberSliderField
            label='Y 起点'
            min={0}
            max={offsetYMax}
            step='any'
            suffix='px'
            value={gridSettings.offsetY}
            onChange={(value) => onGridDecimalChange('offsetY', value, 0, offsetYMax)}
          />
          <NumberSliderField
            label='X 间距'
            min={0}
            max={gapMax}
            step='any'
            suffix='px'
            value={gridSettings.gapX}
            onChange={(value) => onGridDecimalChange('gapX', value, 0, gapMax)}
          />
          <NumberSliderField
            label='Y 间距'
            min={0}
            max={gapMax}
            step='any'
            suffix='px'
            value={gridSettings.gapY}
            onChange={(value) => onGridDecimalChange('gapY', value, 0, gapMax)}
          />
        </div>

        <div className='mt-3'>
          <Button variant='outline' size='sm' className='w-full' disabled={!imageLoaded} onClick={onApplyAutoGrid}>
            <RefreshCw className='mr-1.5 h-3.5 w-3.5' />
            自动匹配网格
          </Button>
        </div>
      </ControlSection>

      <ControlSection icon={<Palette className='h-4 w-4' />} title='透明色'>
        <label className='flex items-center gap-2 text-[12px] text-[var(--text-secondary)]'>
          <input
            type='checkbox'
            checked={transparentSettings.enabled}
            className='h-4 w-4 accent-[var(--accent-primary)]'
            onChange={(event) => onTransparentEnabledChange(event.target.checked)}
          />
          启用颜色转透明
        </label>

        <div className='mt-3 grid grid-cols-[56px_1fr] gap-3'>
          <input
            type='color'
            value={transparentSettings.color}
            className='h-9 w-14 rounded-lg border border-white/10 bg-black/20 p-1'
            onChange={(event) => onTransparentColorChange(event.target.value)}
          />
          <label>
            <span className='mb-1 block text-[12px] text-[var(--text-tertiary)]'>容差：{transparentSettings.tolerance}</span>
            <input
              type='range'
              min={0}
              max={80}
              value={transparentSettings.tolerance}
              className={rangeInputClassName}
              onChange={(event) => onTransparentToleranceChange(event.target.value)}
            />
          </label>
        </div>
      </ControlSection>

      <ControlSection icon={<Timer className='h-4 w-4' />} title='预览速度'>
        <NumberSliderField
          label='FPS'
          min={1}
          max={30}
          step={1}
          value={gridSettings.fps}
          onChange={(value) => onGridNumberChange('fps', value, 1, 30)}
        />
      </ControlSection>
    </aside>
  )
}
