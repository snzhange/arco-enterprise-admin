// @env browser

import type { AppTheme } from './types'

interface RgbColor {
  blue: number
  green: number
  red: number
}

function hexToRgb(hex: string): RgbColor {
  const value = hex.replace('#', '')
  const normalized = value.length === 3
    ? value.split('').map(character => `${character}${character}`).join('')
    : value

  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

function mix(color: RgbColor, target: number, ratio: number): RgbColor {
  return {
    red: Math.round(color.red + (target - color.red) * ratio),
    green: Math.round(color.green + (target - color.green) * ratio),
    blue: Math.round(color.blue + (target - color.blue) * ratio),
  }
}

function toCssRgb(color: RgbColor): string {
  return `${color.red}, ${color.green}, ${color.blue}`
}

export function applyTheme(theme: AppTheme, themeColor: string, colorWeak: boolean): void {
  if (theme === 'dark')
    document.body.setAttribute('arco-theme', 'dark')
  else
    document.body.removeAttribute('arco-theme')

  document.documentElement.style.setProperty('--app-theme-color', themeColor)
  document.body.style.filter = colorWeak ? 'invert(80%)' : 'none'

  const baseColor = hexToRgb(themeColor)
  const lightRatios = [0.92, 0.82, 0.68, 0.48, 0.24]
  const darkRatios = [0.1, 0.2, 0.3, 0.4]
  const palette = [
    ...lightRatios.map(ratio => mix(baseColor, 255, ratio)),
    baseColor,
    ...darkRatios.map(ratio => mix(baseColor, 0, ratio)),
  ]

  palette.forEach((color, index) => {
    document.body.style.setProperty(`--arcoblue-${index + 1}`, toCssRgb(color))
  })
}
