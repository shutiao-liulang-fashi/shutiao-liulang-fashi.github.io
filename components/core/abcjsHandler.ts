import * as ABCJS from "abcjs"

/**
 * 游标控制器回调类型
 * 用于处理播放过程中的事件
 */
export interface CursorControl {
  /** 节拍回调 */
  onBeat?: (beatNumber: number, totalBeats: number, totalTime: number, position: number) => void
  /** 音符事件回调 */
  onEvent?: (event: any) => void
  /** 播放完成回调 */
  onFinished?: () => void
  /** 行结束回调 */
  onLineEnd?: (lineEvent: any, leftEvent: any) => void
  /** 播放开始回调 */
  onStart?: () => void
  /** 准备就绪回调 */
  onReady?: (synthController: any) => void
  /** 额外小节数 */
  extraMeasuresAtBeginning?: number
  /** 行结束提前量 */
  lineEndAnticipation?: number
  /** 节拍细分 */
  beatSubdivisions?: number
}

/**
 * AbcHandler 配置选项
 */
export interface AbcHandlerOptions {
  /** ABC 字符串（播放/渲染模式下必需） */
  abcString?: string

  /** 是否启用播放功能，默认为 false */
  enablePlayback?: boolean

  /** 是否启用渲染功能，默认为 false */
  enableRender?: boolean

  /** 渲染容器（如果 enableRender 为 true，则必须传入） */
  container?: HTMLElement | undefined | null

  /** 播放相关选项 */
  volume?: number
  tempo?: number
  cursorControl?: CursorControl

  /** 音源 URL（可选，如果不提供则使用 abcjs 默认音源） */
  soundFontUrl?: string

  /** 渲染相关选项 */
  renderOptions?: ABCJS.RenderOptions
  showTitle?: boolean

  /** 播放回调 */
  onPlay?: () => void
  onStop?: () => void

  /** 是否启用响应式重渲染，默认为 false */
  responsive?: boolean
}

/**
 * ABC 统一处理器
 * 合并了播放和渲染功能，通过参数灵活控制
 *
 * 使用示例：
 *
 * 1. 仅播放模式（生成隐藏容器）：
 * ```typescript
 * const handler = new AbcHandler({
 *   abcString: 'C D E F | G A B c',
 *   enablePlayback: true,
 *   enableRender: false
 * })
 * await handler.play()
 * ```
 *
 * 2. 仅渲染模式（需要传入容器）：
 * ```typescript
 * const handler = new AbcHandler({
 *   abcString: 'C D E F | G A B c',
 *   enablePlayback: false,
 *   enableRender: true,
 *   container: document.getElementById('sheet-music')
 * })
 * await handler.render()
 * ```
 *
 * 3. 播放+渲染模式（需要传入容器）：
 * ```typescript
 * const handler = new AbcHandler({
 *   abcString: 'C D E F | G A B c',
 *   enablePlayback: true,
 *   enableRender: true,
 *   container: document.getElementById('sheet-music'),
 * })
 * await handler.render()
 * await handler.play()
 * ```
 */
export class AbcHandler {
  // 播放相关
  private audioContext: AudioContext | null = null
  private synthController: any = null
  private hiddenContainer: HTMLElement | null = null
  private isPlayingState = false
  private volume: number = 0.8
  private tempo: number = 120
  private soundFontUrl?: string
  private onPlayCallback?: () => void
  private onStopCallback?: () => void
  private cursorControlOptions?: CursorControl

  // 渲染相关
  private container: HTMLElement | null = null
  private currentAbcString: string = ''
  private showTitle: boolean = false
  private renderOptions: ABCJS.RenderOptions | undefined
  private resizeHandler: (() => void) | null = null

  // 配置
  private enablePlayback: boolean = false
  private enableRender: boolean = false
  private visualObj: any = null
  private noteElements: HTMLElement[] = []

  /**
   * 构造函数
   * @param options 配置选项
   */
  constructor(options: AbcHandlerOptions) {
    const {
      abcString = '',
      enablePlayback = false,
      enableRender = false,
      container,
      volume = 0.8,
      tempo = 120,
      cursorControl,
      soundFontUrl = '/music/',
      renderOptions,
      showTitle,
      onPlay,
      onStop,
      responsive = false
    } = options



    this.currentAbcString = abcString || ''
    this.enablePlayback = enablePlayback
    this.enableRender = enableRender
    this.volume = Math.max(0, Math.min(1, volume))
    this.tempo = tempo
    this.soundFontUrl = soundFontUrl
    this.cursorControlOptions = cursorControl
    this.renderOptions = renderOptions
    this.showTitle = showTitle !== undefined ? showTitle : this.hasTitleInAbc(abcString || '')
    this.onPlayCallback = onPlay
    this.onStopCallback = onStop

    // 如果启用渲染，必须有容器
    if (enableRender && !container) {
      throw new Error('enableRender 为 true 时，必须传入 container 参数')
    }

    this.container = container || null

    // 如果启用播放，创建隐藏容器
    if (enablePlayback) {
      this.createHiddenContainer()
    }

    // 如果启用响应式，监听窗口变化
    if (enableRender && responsive) {
      this.enableResponsive()
    }
  }

  /**
   * 创建隐藏的渲染容器（用于播放）
   */
  private createHiddenContainer(): void {
    if (this.hiddenContainer) return

    const container = document.createElement('div')
    container.className = 'abcjs-hidden-container'
    container.style.cssText = `
      position: fixed !important;
      left: -9999px !important;
      top: -9999px !important;
      width: 0px !important;
      height: 0px !important;
      overflow: hidden !important;
      z-index: -1 !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
      display: none !important;
    `
    document.body.appendChild(container)
    this.hiddenContainer = container
  }

  /**
   * 初始化音频上下文
   */
  private async initAudioContext(): Promise<void> {
    if (!this.enablePlayback) {
      throw new Error('未启用播放功能')
    }

    // 如果 AudioContext 不存在或已关闭，创建新的
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      ABCJS.synth.registerAudioContext(this.audioContext)
    }

    // 如果状态是 suspended，恢复它
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  /**
   * 检测 ABC 字符串是否包含标题
   */
  private hasTitleInAbc(abcStr: string): boolean {
    const lines = abcStr.split('\n')
    return lines.some(line => line.trim().startsWith('T:'))
  }

  /**
   * 处理 ABC 字符串，根据 showTitle 选项控制标题显示
   */
  private processAbcString(abcStr: string): string {
    if (this.showTitle) {
      return abcStr
    }

    // 移除标题行 (T:)
    const lines = abcStr.split('\n')
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim()
      return !trimmed.startsWith('T:')
    })

    return filteredLines.join('\n')
  }



  /**
   * 渲染 ABC 到容器
   */
  async render(): Promise<void> {
    if (!this.enableRender || !this.container) {
      throw new Error('未启用渲染功能或容器未设置')
    }

    try {
      // 清空容器
      this.container.innerHTML = ''

      // 处理 ABC 字符串
      const processedAbcStr = this.processAbcString(this.currentAbcString)

      // 等待一帧
      await new Promise(resolve => requestAnimationFrame(resolve))

      // 配置渲染选项
      let renderOptions: ABCJS.RenderOptions = {
        responsive: "resize",
        scale: 1.0,
        paddingtop: 10,
        paddingbottom: 10,
        paddingleft: 20,
        paddingright: 20,
      }

      // 合并用户传入的选项
      if (this.renderOptions) {
        renderOptions = { ...renderOptions, ...this.renderOptions }
      }

      // 渲染
      const visualObjs = ABCJS.renderAbc(this.container, processedAbcStr, renderOptions)
      this.visualObj = visualObjs[0]

      if (!this.visualObj) {
        throw new Error('渲染 ABC 失败')
      }

      // 如果同时启用了播放，初始化播放器
      if (this.enablePlayback) {
        await this.initPlayback()
      }
    } catch (error) {
      throw new Error(`渲染失败：${(error as Error).message}`)
    }
  }

  /**
   * 初始化播放器（但不播放）
   */
  private async initPlayback(): Promise<void> {
    if (!this.enablePlayback || !this.hiddenContainer) {
      return
    }

    try {
      // 清空隐藏容器
      this.hiddenContainer.innerHTML = ''

      // 等待容器清空
      await new Promise(resolve => setTimeout(resolve, 50))

      // 创建合成器控制器
      this.synthController = new ABCJS.synth.SynthController()


      // 创建游标控制器
      const finalCursorControl: CursorControl = {
        onBeat: (beatNumber: number, totalBeats: number, totalTime: number, position: number) => {
          this.cursorControlOptions?.onBeat?.(beatNumber, totalBeats, totalTime, position)
        },
        onEvent: (event: any) => {
          this.cursorControlOptions?.onEvent?.(event)
        },
        onFinished: () => {
          this.isPlayingState = false
          this.onStopCallback?.()
          this.cursorControlOptions?.onFinished?.()
        },
        onLineEnd: (lineEvent: any, leftEvent: any) => {
          this.cursorControlOptions?.onLineEnd?.(lineEvent, leftEvent)
        },
        onStart: () => {
          this.cursorControlOptions?.onStart?.()
        },
        onReady: (synthController: any) => {
          this.cursorControlOptions?.onReady?.(synthController)
        }
      }

      // 如果已经有 visualObj（从渲染获取），直接使用
      if (!this.visualObj) {
        // 否则，渲染到隐藏容器
        const visualObjs = ABCJS.renderAbc(this.hiddenContainer, this.currentAbcString, {
          responsive: 'resize',
        })
        this.visualObj = visualObjs[0]
      }

      if (!this.visualObj) {
        throw new Error('获取 visualObj 失败')
      }

      // 等待渲染完成
      await new Promise(resolve => setTimeout(resolve, 150))

      // 加载游标控制器
      this.synthController.load(this.hiddenContainer, finalCursorControl, {
        displayLoop: false,
        displayRestart: false,
        displayPlay: false,
        displayProgress: false,
        displayWarp: false,
      })

      // 等待加载完成
      await new Promise(resolve => setTimeout(resolve, 200))

      // 设置 tune（但不播放）
      const audioParams: any = {
        soundFontVolumeMultiplier: this.volume,
        qpm: this.tempo,
      }

      // 如果提供了 soundFontUrl，添加到参数中
      if (this.soundFontUrl) {
        audioParams.soundFontUrl = this.soundFontUrl
      }

      await this.synthController.setTune(this.visualObj, false, audioParams)
    } catch (error) {
      this.synthController = null
      throw new Error(`初始化播放器失败：${(error as Error).message}`)
    }
  }

  /**
   * 播放
   */
  async play(): Promise<void> {
    if (!this.enablePlayback) {
      throw new Error('未启用播放功能')
    }

    if (this.isPlayingState) {
      return
    }

    try {
      // 初始化音频上下文
      await this.initAudioContext()

      // 如果还没有初始化播放器，先初始化
      if (!this.synthController) {
        await this.initPlayback()
      }

      if (!this.synthController) {
        throw new Error('播放器未初始化')
      }

      // 播放
      this.synthController.play()

      // 等待播放真正开始
      await new Promise(resolve => setTimeout(resolve, 50))

      this.isPlayingState = true
      this.onPlayCallback?.()
    } catch (error) {
      this.isPlayingState = false
      throw new Error(`播放失败：${(error as Error).message}`)
    }
  }

  /**
   * 从指定音符开始播放
   * @param noteIndex 音符索引
   */
  async playFromNote(noteIndex: number): Promise<void> {
    if (!this.enablePlayback) {
      throw new Error('未启用播放功能')
    }

    if (noteIndex < 0 || noteIndex >= this.noteElements.length) {
      throw new Error(`音符索引超出范围：${noteIndex}`)
    }

    try {
      // 停止当前播放
      this.stop()

      // 初始化音频上下文
      await this.initAudioContext()

      // 如果还没有初始化播放器，先初始化
      if (!this.synthController) {
        await this.initPlayback()
      }

      if (!this.synthController || !this.visualObj) {
        throw new Error('播放器未初始化')
      }

      // 重新设置 tune，并从指定音符开始播放
      const audioParams: any = {
        soundFontVolumeMultiplier: this.volume,
        qpm: this.tempo,
        startDelay: noteIndex
      }

      // 如果提供了 soundFontUrl，添加到参数中
      if (this.soundFontUrl) {
        audioParams.soundFontUrl = this.soundFontUrl
      }

      await this.synthController.setTune(this.visualObj, true, audioParams)

      // 等待设置完成
      await new Promise(resolve => setTimeout(resolve, 100))

      this.isPlayingState = true
      this.onPlayCallback?.()
    } catch (error) {
      this.isPlayingState = false
      throw new Error(`从音符播放失败：${(error as Error).message}`)
    }
  }

  /**
   * 停止播放
   */
  stop(): void {
    if (!this.enablePlayback) return

    if (this.synthController) {
      try {
        this.synthController.destroy()
      } catch (error) {
        console.error('停止播放时出错:', error)
      }
      this.synthController = null
    }

    if (this.hiddenContainer) {
      this.hiddenContainer.innerHTML = ''
    }

    this.isPlayingState = false
    this.onStopCallback?.()
  }

  /**
   * 暂停播放
   */
  pause(): void {
    if (this.synthController) {
      this.synthController.pause()
    }
  }

  /**
   * 重新开始播放
   */
  restart(): void {
    if (this.synthController) {
      this.synthController.restart()
    }
  }

  /**
   * 检查是否正在播放
   */
  isPlaying(): boolean {
    return this.isPlayingState
  }

  /**
   * 设置音量
   * @param volume 音量值，范围 0-1
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
  }

  /**
   * 获取当前音量
   */
  getVolume(): number {
    return this.volume
  }

  /**
   * 设置播放速度
   * @param tempo 速度（BPM）
   */
  setTempo(tempo: number): void {
    this.tempo = tempo
  }

  /**
   * 获取当前速度
   */
  getTempo(): number {
    return this.tempo
  }

  /**
   * 更新 ABC 字符串
   * @param abcString 新的 ABC 字符串
   */
  async updateAbcString(abcString: string): Promise<void> {
    if (!abcString) {
      throw new Error('abcString 不能为空')
    }

    this.currentAbcString = abcString

    // 停止当前播放
    this.stop()

    // 清空 visualObj
    this.visualObj = null

    // 如果启用了渲染，重新渲染
    if (this.enableRender) {
      await this.render()
    } else if (this.enablePlayback) {
      // 如果只启用了播放，重新初始化播放器
      await this.initPlayback()
    }
  }

  /**
   * 启用响应式重渲染
   */
  enableResponsive(): void {
    if (this.resizeHandler || !this.enableRender) {
      return
    }

    this.resizeHandler = () => {
      if (this.currentAbcString && this.enableRender) {
        this.render().catch(error => {
          console.error('响应式重渲染失败:', error)
        })
      }
    }

    window.addEventListener('resize', this.resizeHandler)
  }

  /**
   * 禁用响应式重渲染
   */
  disableResponsive(): void {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
      this.resizeHandler = null
    }
  }

  /**
   * 清空渲染容器
   */
  clear(): void {
    if (this.container) {
      this.container.innerHTML = ''
    }
    this.noteElements = []
  }

/**
 * 销毁处理器，释放资源
 */
dispose(): void {
  // 停止播放
  this.stop()

  // 销毁音频上下文
  if (this.audioContext) {
    try {
      if (this.audioContext.state !== 'closed') {
        this.audioContext.close()
      }
    } catch (error) {
      console.error('关闭 AudioContext 时出错:', error)
    }
    this.audioContext = null
  }

  // 移除隐藏容器
  if (this.hiddenContainer && this.hiddenContainer.parentNode) {
    this.hiddenContainer.parentNode.removeChild(this.hiddenContainer)
    this.hiddenContainer = null
  }

  // 禁用响应式
  this.disableResponsive()

  // 清空容器
  this.clear()

  // 清空引用
  this.container = null
  this.visualObj = null
  this.noteElements = []
  this.onPlayCallback = undefined
  this.onStopCallback = undefined
  this.cursorControlOptions = undefined
}

}
