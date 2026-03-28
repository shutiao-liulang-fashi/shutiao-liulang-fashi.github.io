import * as ABCJS from "abcjs"

/**
 * ABC 音频播放器
 * 封装了使用 abcjs 播放音频的功能
 */
export class AbcAudioPlayer {
  private audioContext: AudioContext | null = null
  private synthController: ABCJS.synth.SynthController | null = null
  private hiddenContainer: HTMLElement | null = null
  private isPlayingState = false
  private onPlayCallback?: () => void
  private onStopCallback?: () => void
  private volume: number = 0.8 // 默认音量，范围 0-1

  /**
   * 构造函数
   * @param defaultVolume 默认音量，范围 0-1，默认为 0.8
   */
  constructor(defaultVolume: number = 0.8) {
    this.volume = Math.max(0, Math.min(1, defaultVolume)) // 确保音量在 0-1 范围内
    this.createHiddenContainer()
  }

  /**
   * 创建隐藏的渲染容器
   */
  private createHiddenContainer(): void {
    const container = document.createElement('div')
    container.className = 'abc-audio-hidden-container'
    container.style.cssText = `
      position: fixed !important;
      left: -9999px !important;
      top: -9999px !important;
      width: 0px !important;
      height: 0px !important;
      overflow: hidden !important;
      z-index: -1 !important;
      visibility: hidden !important;
    `
    document.body.appendChild(container)
    this.hiddenContainer = container
  }

  /**
   * 初始化音频上下文
   */
  private async initAudioContext(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      ABCJS.synth.registerAudioContext(this.audioContext)
    }
  }

  /**
   * 播放 ABC 记谱法音频
   * @param abcString ABC 记谱法字符串
   * @returns Promise<void>
   */
  async play(abcString: string): Promise<void> {
    if (!abcString || !this.hiddenContainer) {
      throw new Error('ABC 字符串或容器为空')
    }

    try {
      // 初始化音频上下文
      await this.initAudioContext()

      // 等待 AudioContext 完全准备好
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // 清空容器
      this.hiddenContainer.innerHTML = ''

      // 等待容器清空完成
      await new Promise(resolve => setTimeout(resolve, 50))

      // 创建合成器控制器
      this.synthController = new ABCJS.synth.SynthController()

      // 创建游标控制器
      const cursorControl: ABCJS.synth.CursorControl = {
        onBeat: (beatNumber: number, totalBeats: number, totalTime: number) => {
          // 不需要处理
        },
        onEvent: (event: any) => {
          // ABCJS 的事件结构
          if (event && event.midiPitches && event.midiPitches.length > 0) {
            // 可以在这里处理音符事件
          }
        },
        onFinished: () => {
          this.isPlayingState = false
          this.onStopCallback?.()
        }
      }

      // 使用 abcjs 渲染到隐藏容器
      const visualObjs = ABCJS.renderAbc(this.hiddenContainer, abcString, {
        responsive: 'resize',
      })
      const visualObj = visualObjs[0] // 获取第一个（通常只有一个）

      // 等待渲染完成
      await new Promise(resolve => setTimeout(resolve, 150))

      // 加载并播放（使用音量参数）
      this.synthController.load(this.hiddenContainer, cursorControl, {
        soundFontVolumeMultiplier: this.volume,
      })

      // 等待加载完成
      await new Promise(resolve => setTimeout(resolve, 200))

      // 设置 tune 并播放
      await this.synthController.setTune(visualObj, false, {})

      // 等待 setTune 完成，确保音频数据已准备好
      await new Promise(resolve => setTimeout(resolve, 100))

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
   * 停止播放
   */
  stop(): void {
    if (this.synthController) {
      this.synthController.stop()
      this.isPlayingState = false
      this.onStopCallback?.()
    }
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
   * @returns 当前音量值，范围 0-1
   */
  getVolume(): number {
    return this.volume
  }

  /**
   * 设置播放开始回调
   */
  onPlay(callback: () => void): void {
    this.onPlayCallback = callback
  }

  /**
   * 设置播放停止回调
   */
  onStop(callback: () => void): void {
    this.onStopCallback = callback
  }

  /**
   * 销毁播放器，释放资源
   */
  dispose(): void {
    this.stop()
    if (this.synthController) {
      this.synthController.dispose()
      this.synthController = null
    }
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    // 移除隐藏的容器
    if (this.hiddenContainer && this.hiddenContainer.parentNode) {
      this.hiddenContainer.parentNode.removeChild(this.hiddenContainer)
      this.hiddenContainer = null
    }
  }
}

/**
 * ABC 五线谱渲染器
 * 封装了使用 abcjs 渲染五线谱的功能
 */
export class AbcRenderer {
  private container: HTMLElement | null = null
  private currentAbcString: string = ''
  private showTitle: boolean = false
  private resizeHandler: (() => void) | null = null

  /**
   * 构造函数
   * @param container 渲染容器
   */
  constructor(container: HTMLElement | null) {
    this.container = container
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
    // 如果 showTitle 为 true，则不做任何处理
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
   * 渲染 ABC 记谱法到五线谱
   * @param abcString ABC 记谱法字符串
   * @param options 渲染选项
   * @param showTitle 是否显示标题（如果未指定，自动检测）
   */
  async render(
    abcString: string,
    options?: ABCJS.RenderOptions,
    showTitle?: boolean
  ): Promise<void> {
    if (!this.container || !abcString) {
      throw new Error('容器或 ABC 字符串为空')
    }

    try {
      this.currentAbcString = abcString

      // 如果 showTitle 未指定，自动检测是否包含标题
      if (showTitle === undefined) {
        this.showTitle = this.hasTitleInAbc(abcString)
      } else {
        this.showTitle = showTitle
      }

      // 清空容器
      this.container.innerHTML = ''

      // 处理 ABC 字符串
      const processedAbcStr = this.processAbcString(abcString)

      // 等待一帧，确保容器已经渲染
      await new Promise(resolve => requestAnimationFrame(resolve))

      // 获取容器宽度
      const containerWidth = this.container.clientWidth || 800

      // 合并选项
      const renderOptions: ABCJS.RenderOptions = {
        responsive: "resize",
        scale: 1.0,
        paddingtop: 10,
        paddingbottom: 10,
        paddingleft: 20,
        paddingright: 20,
        stretchlast: false, // 不拉伸最后一行
        staffwidth: Math.max(containerWidth - 40, 400),
        wrap: {
          minSpacing: 1.0,     // 最小间距
          maxSpacing: 1.6,     // 超过此值会换行
          preferredMeasuresPerLine: 4, // 每行首选 4 个小节
        },
        ...options,
      }

      // 使用 abcjs 渲染
      ABCJS.renderAbc(this.container, processedAbcStr, renderOptions)
    } catch (error) {
      throw new Error(`渲染失败：${(error as Error).message}`)
    }
  }

  /**
   * 启用响应式重渲染，监听窗口大小变化
   */
  enableResponsive(): void {
    if (this.resizeHandler) {
      return // 已经启用
    }

    this.resizeHandler = () => {
      if (this.currentAbcString) {
        this.render(this.currentAbcString, undefined, this.showTitle)
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
    this.currentAbcString = ''
  }

  /**
   * 销毁渲染器，释放资源
   */
  dispose(): void {
    this.disableResponsive()
    this.clear()
    this.container = null
  }
}
