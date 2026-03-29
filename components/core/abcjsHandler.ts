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
 * ABC 音频播放器
 * 封装了使用 abcjs 播放音频的功能
 */
export class AbcAudioPlayer {
  private audioContext: AudioContext | null = null
  private synthController: any = null // 使用 any 类型，因为 abcjs 的类型定义可能不完整
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
    // 使用更强的隐藏样式
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
    // 如果 AudioContext 不存在或已关闭，创建新的
    if (!this.audioContext || this.audioContext.state === 'closed') {
      // 为每个实例创建独立的 AudioContext，而不是共享全局的
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      ABCJS.synth.registerAudioContext(this.audioContext)
    }

    // 如果状态是 suspended，恢复它
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  /**
   * 播放 ABC 记谱法音频
   * @param abcString ABC 记谱法字符串
   * @param options 可选参数
   * @param options.cursorControl 自定义游标控制器
   * @param options.tempo 播放速度（BPM）
   * @returns Promise<void>
   */
  async play(abcString: string, options?: {
    cursorControl?: CursorControl
    tempo?: number
  }): Promise<void> {
    if (!abcString || !this.hiddenContainer) {
      throw new Error('ABC 字符串或容器为空')
    }

    // 如果已经在播放，直接返回，避免重复播放
    if (this.isPlayingState) {
      console.log('正在播放中，忽略重复播放请求')
      return
    }

    const { cursorControl, tempo } = options || {}

    try {
      // 初始化音频上下文
      await this.initAudioContext()

      // 清空容器
      this.hiddenContainer.innerHTML = ''

      // 等待容器清空完成
      await new Promise(resolve => setTimeout(resolve, 50))

      // 创建合成器控制器
      this.synthController = new ABCJS.synth.SynthController()

      // 创建游标控制器（使用传入的或默认的）
      const finalCursorControl: CursorControl = cursorControl || {
        onBeat: (beatNumber: number, totalBeats: number, totalTime: number, position: number) => {
          // 不需要处理
        },
        onEvent: (event: any) => {
          // 可以在这里处理音符事件
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

      if (!visualObj) {
        throw new Error('渲染 ABC 失败')
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

      // 准备 setTune 参数
      const audioParams: any = {
        soundFontVolumeMultiplier: this.volume,
      }
      if (tempo) {
        audioParams.qpm = tempo
      }

      // 设置 tune 并播放
      await this.synthController.setTune(visualObj, false, audioParams)

      // 等待 setTune 完成，确保音频数据已准备好
      await new Promise(resolve => setTimeout(resolve, 100))

      this.synthController.play()

      // 等待播放真正开始
      await new Promise(resolve => setTimeout(resolve, 50))

      this.isPlayingState = true
      this.onPlayCallback?.()
    } catch (error) {
      this.isPlayingState = false
      this.synthController = null
      throw new Error(`播放失败：${(error as Error).message}`)
    }
  }

  /**
   * 停止播放
   */
  stop(): void {
    if (this.synthController) {
      try {
        // 使用 destroy 方法来停止播放并清理资源
        this.synthController.destroy()
      } catch (error) {
        console.error('停止播放时出错:', error)
      }
      // 清空控制器
      this.synthController = null
    }

    // 清空容器
    if (this.hiddenContainer) {
      this.hiddenContainer.innerHTML = ''
    }

    // 重置播放状态
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
   * 更新当前要播放的 ABC 字符串（但不自动播放）
   * @param abcString ABC 记谱法字符串
   */
  async update(abcString: string): Promise<void> {
    if (!abcString || !this.hiddenContainer) {
      throw new Error('ABC 字符串或容器为空')
    }

    try {
      // 停止当前播放
      this.stop()
      this.isPlayingState = false

      // 不在这里初始化音频上下文，避免在没有用户交互时创建 AudioContext
      // AudioContext 将在 play() 方法中初始化

      // 清空容器
      this.hiddenContainer.innerHTML = ''

      // 等待容器清空完成
      await new Promise(resolve => setTimeout(resolve, 50))

      // 创建合成器控制器
      this.synthController = new ABCJS.synth.SynthController()

      // 创建游标控制器
      const finalCursorControl: CursorControl = {
        onBeat: (beatNumber: number, totalBeats: number, totalTime: number, position: number) => {
          // 不需要处理
        },
        onEvent: (event: any) => {
          // 可以在这里处理音符事件
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

      if (!visualObj) {
        throw new Error('渲染 ABC 失败')
      }

      // 等待渲染完成
      await new Promise(resolve => setTimeout(resolve, 150))

      // 加载（使用音量参数）
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
      await this.synthController.setTune(visualObj, false, {
        soundFontVolumeMultiplier: this.volume,
      })
    } catch (error) {
      this.isPlayingState = false
      this.synthController = null
      throw new Error(`更新失败：${(error as Error).message}`)
    }
  }

  /**
   * 复位到初始状态
   */
  reset(): void {
    this.stop()
    this.isPlayingState = false
    if (this.onStopCallback) {
      this.onStopCallback()
    }
  }

  /**
   * 销毁播放器，释放资源
   */
  dispose(): void {
    // 先停止播放
    if (this.synthController) {
      try {
        this.synthController.destroy()
      } catch (error) {
        console.error('销毁控制器时出错:', error)
      }
      this.synthController = null
    }

    // 关闭并清空音频上下文
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
 *
 * 注意：abcjs 天然支持两种换行方式同时工作：
 * 1. 手动换行：用户在 ABC 字符串中使用 % 符号，会始终被尊重
 * 2. 自动换行：通过 preferredMeasuresPerLine 控制
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
  constructor(container: HTMLElement | null = null) {
    this.container = container
  }

  /**
   * 设置渲染容器
   * @param container 渲染容器
   */
  setContainer(container: HTMLElement | null): void {
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
      let containerWidth = this.container.clientWidth || this.container.offsetWidth || 800

      // 如果容器宽度太小，尝试从父元素获取
      if (containerWidth < 100) {
        const parent = this.container.parentElement
        if (parent) {
          containerWidth = parent.clientWidth || parent.offsetWidth || 800
        }
      }

      // 如果宽度仍然太小，尝试从祖父元素获取
      if (containerWidth < 100) {
        const grandParent = this.container.parentElement?.parentElement
        if (grandParent) {
          containerWidth = grandParent.clientWidth || grandParent.offsetWidth || 800
        }
      }

      // 配置换行参数
      // abcjs 默认会尊重用户输入的换行符（回车）
      // wrap 配置用于控制当没有手动换行时，如何自动换行
      let renderOptions: ABCJS.RenderOptions = {
        responsive: "resize",
        scale: 1.0,
        paddingtop: 10,
        paddingbottom: 10,
        paddingleft: 20,
        paddingright: 20,
      }

      // 合并用户传入的选项
      if (options) {
        renderOptions = { ...renderOptions, ...options }
      }

      // 使用 abcjs 渲染
      console.log('开始渲染 ABC 字符串:', processedAbcStr.substring(0, 100) + '...')
      console.log('渲染选项:', renderOptions)
      const result = ABCJS.renderAbc(this.container, processedAbcStr, renderOptions)
      console.log('渲染结果:', result)
    } catch (error) {
      console.error('渲染 ABC 时出错:', error)
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
   * 更新渲染（与 render 相同，但提供更好的语义）
   * @param abcString ABC 记谱法字符串
   * @param options 渲染选项
   * @param showTitle 是否显示标题（如果未指定，自动检测）
   */
  async update(
    abcString: string,
    options?: ABCJS.RenderOptions,
    showTitle?: boolean
  ): Promise<void> {
    return this.render(abcString, options, showTitle)
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
