import type { GridSettings, TransparentSettings } from './types'

export const initialGridSettings: GridSettings = {
  columns: 4,
  frameCount: 16,
  frameHeight: 64,
  frameWidth: 64,
  fps: 8,
  gapX: 0,
  gapY: 0,
  offsetX: 0,
  offsetY: 0,
  rows: 4,
}

export const initialTransparentSettings: TransparentSettings = {
  color: '#000000',
  enabled: false,
  tolerance: 18,
}

export const rangeInputClassName =
  'h-5 w-full appearance-none bg-transparent accent-[var(--accent-primary)] disabled:cursor-not-allowed [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-white/10 [&::-webkit-slider-thumb]:-mt-1.5 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-sky-100/50 [&::-webkit-slider-thumb]:bg-sky-300 [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(56,189,248,0.14)]'
