/// <reference types="vite/client" />

// Preload exposes ElectronAPI on window via contextBridge
import type { ElectronAPI } from '../shared/types'
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

// Image imports
declare module "*.png" {
  const src: string
  export default src
}

declare module "*.jpg" {
  const src: string
  export default src
}

declare module "*.jpeg" {
  const src: string
  export default src
}

declare module "*.svg" {
  const src: string
  export default src
}

// PDF imports (used with ?url suffix for react-pdf)
declare module "*.pdf?url" {
  const src: string
  export default src
}
