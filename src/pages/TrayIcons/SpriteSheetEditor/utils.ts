import type { NumberSliderFieldProps } from './types'

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function readInteger(value: string, fallback: number, min: number, max: number) {
  const nextValue = Number(value)
  if (!Number.isFinite(nextValue)) {
    return fallback
  }

  return clamp(Math.round(nextValue), min, max)
}

export function readNumber(value: string, fallback: number, min: number, max: number) {
  const nextValue = Number(value)
  if (!Number.isFinite(nextValue)) {
    return fallback
  }

  return clamp(nextValue, min, max)
}

function getDecimalPlaces(value: number) {
  const valueText = String(value)
  if (!valueText.includes('.')) {
    return 0
  }

  return valueText.split('.')[1]?.length || 0
}

export function getStepperStep(step: NumberSliderFieldProps['step']) {
  return step === 'any' ? 0.1 : step || 1
}

export function formatSteppedValue(value: number, step: number) {
  const precision = getDecimalPlaces(step)
  if (!precision) {
    return String(Math.round(value))
  }

  return String(Number(value.toFixed(precision)))
}
