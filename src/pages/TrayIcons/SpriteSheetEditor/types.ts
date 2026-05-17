export type SpriteSheetEditorProps = {
  onImported?: () => Promise<boolean> | boolean | void
}

export type ImageInfo = {
  height: number
  name: string
  width: number
}

export type GridSettings = {
  columns: number
  frameCount: number
  frameHeight: number
  frameWidth: number
  fps: number
  gapX: number
  gapY: number
  offsetX: number
  offsetY: number
  rows: number
}

export type TransparentSettings = {
  color: string
  enabled: boolean
  tolerance: number
}

export type SpriteFrameRect = {
  enabled: boolean
  height: number
  index: number
  inside: boolean
  width: number
  x: number
  y: number
}

export type RenderedSpriteFrame = SpriteFrameRect & {
  dataUrl: string
  fileName: string
}

export type TrayIconMutationResponse = {
  message?: string
  success?: boolean
}

export type NumberSliderFieldProps = {
  disabled?: boolean
  label: string
  max: number
  min: number
  onChange: (value: string) => void
  step?: number | 'any'
  suffix?: string
  value: number
}

export type GridNumberKey = keyof GridSettings
