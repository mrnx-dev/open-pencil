/// <reference types="vite/client" />
import CanvasKitInit, { type CanvasKit } from 'canvaskit-wasm'

import { IS_BROWSER } from './constants'

let instance: CanvasKit | null = null

export interface CanvasKitOptions {
  locateFile?: (file: string) => string
}

export async function getCanvasKit(options?: CanvasKitOptions): Promise<CanvasKit> {
  if (instance) return instance

  const defaultLocate = (file: string) => {
    if (!IS_BROWSER) {
      const ckPath = import.meta.resolve('canvaskit-wasm')
      let path = decodeURIComponent(new URL(file, ckPath).pathname)
      // Windows: new URL(...).pathname returns "/C:/..." which is invalid, strip leading "/"
      if (path.startsWith('/') && /^[a-zA-Z]:/.test(path.slice(1))) path = path.slice(1)
      return path
    }
    const base = 'env' in import.meta ? import.meta.env.BASE_URL : '/'
    const prefix = base === '/' ? '' : base.replace(/\/$/, '')
    return `${prefix}/${file}`
  }

  instance = await CanvasKitInit({
    locateFile: options?.locateFile ?? defaultLocate
  })

  return instance
}
