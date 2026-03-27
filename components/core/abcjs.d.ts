// ABCJS 类型声明
declare module "abcjs" {
  export interface RenderOptions {
    responsive?: "resize" | "scroll"
    scale?: number
    paddingtop?: number
    paddingbottom?: number
    paddingleft?: number
    paddingright?: number
    generateDownload?: boolean
    generateInline?: boolean
    stretchlast?: boolean
    staffwidth?: number
    wrap?: {
      minSpacing: number
      maxSpacing: number
      preferredMeasuresPerLine: number
    }
  }

  export interface VisualObj {
    lines: any[]
    staff?: any[]
  }

  export interface AudioObj {
    start: () => void
    stop: () => void
  }

  export function renderAbc(
    element: HTMLElement,
    abcString: string,
    options?: RenderOptions
  ): VisualObj[] | AudioObj[]

  export function stopAll(): void
}
