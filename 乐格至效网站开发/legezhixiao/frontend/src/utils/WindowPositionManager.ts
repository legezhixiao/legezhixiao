/**
 * 窗口位置管理器
 * 处理可拖拽窗口的位置约束和显示逻辑
 */

export interface WindowPosition {
  x: number
  y: number
}

export interface WindowSize {
  width: number
  height: number
}

export interface WindowBounds {
  position: WindowPosition
  size: WindowSize
}

export class WindowPositionManager {
  private static readonly MIN_VISIBLE_HEIGHT = 100 // 确保至少100px高度可见
  private static readonly MIN_WINDOW_WIDTH = 300
  private static readonly MIN_WINDOW_HEIGHT = 200
  
  /**
   * 约束窗口位置，仅限制顶部边界，允许左右底部超出屏幕
   * @param position 当前位置
   * @param size 窗口大小
   * @returns 约束后的位置
   */
  static constrainPosition(position: WindowPosition, size: WindowSize): WindowPosition {
    // 仅约束顶部，确保标题栏至少有一部分可见
    const constrainedY = Math.max(-size.height + this.MIN_VISIBLE_HEIGHT, position.y)
    
    // 不限制左右和底部边界，允许窗口部分或完全移出视窗
    return {
      x: position.x, // 不约束左右
      y: constrainedY
    }
  }

  /**
   * 约束窗口大小
   * @param size 当前大小
   * @returns 约束后的大小
   */
  static constrainSize(size: WindowSize): WindowSize {
    return {
      width: Math.max(this.MIN_WINDOW_WIDTH, size.width),
      height: Math.max(this.MIN_WINDOW_HEIGHT, size.height)
    }
  }

  /**
   * 检查窗口是否需要调整以确保内容可见
   * @param bounds 窗口边界
   * @returns 是否需要调整
   */
  static needsContentVisibilityAdjustment(bounds: WindowBounds): boolean {
    const { position, size } = bounds
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // 检查窗口是否有足够的可见区域显示核心内容
    const visibleTop = Math.max(0, position.y)
    const visibleBottom = Math.min(viewportHeight, position.y + size.height)
    const visibleLeft = Math.max(0, position.x)
    const visibleRight = Math.min(viewportWidth, position.x + size.width)
    
    const visibleHeight = Math.max(0, visibleBottom - visibleTop)
    const visibleWidth = Math.max(0, visibleRight - visibleLeft)
    
    // 确保有足够的可见区域显示输入框和发送按钮（固定在底部120px高度）
    const minRequiredHeight = 120 // 输入区域固定高度 + 一些对话内容
    const minRequiredWidth = 300  // 输入框和发送按钮的最小宽度
    
    return visibleHeight < minRequiredHeight || visibleWidth < minRequiredWidth
  }

  /**
   * 调整窗口位置以确保核心内容可见
   * @param bounds 当前窗口边界
   * @returns 调整后的窗口边界
   */
  static adjustForContentVisibility(bounds: WindowBounds): WindowBounds {
    const { position, size } = bounds
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    let newPosition = { ...position }
    let newSize = { ...size }
    
    // 如果窗口太小，先调整大小
    newSize = this.constrainSize(newSize)
    
    // 确保有足够的内容可见
    const minRequiredHeight = 120 // 输入区域固定高度（确保输入框和发送按钮可见）
    const minRequiredWidth = 300
    
    // 如果窗口完全在右侧外面，移动到可见区域
    if (newPosition.x >= viewportWidth) {
      newPosition.x = viewportWidth - minRequiredWidth
    }
    
    // 如果窗口完全在左侧外面，移动到可见区域
    if (newPosition.x + newSize.width <= 0) {
      newPosition.x = -(newSize.width - minRequiredWidth)
    }
    
    // 如果窗口完全在底部外面，移动到可见区域
    if (newPosition.y >= viewportHeight) {
      newPosition.y = viewportHeight - minRequiredHeight
    }
    
    // 应用顶部约束
    newPosition = this.constrainPosition(newPosition, newSize)
    
    return { position: newPosition, size: newSize }
  }

  /**
   * 获取默认窗口位置
   * @param size 窗口大小
   * @returns 默认位置
   */
  static getDefaultPosition(size: WindowSize): WindowPosition {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // 默认放在右下角，但确保可见
    const defaultX = Math.max(0, viewportWidth - size.width - 20)
    const defaultY = Math.max(0, viewportHeight - size.height - 20)
    
    return this.constrainPosition({ x: defaultX, y: defaultY }, size)
  }

  /**
   * 处理窗口大小变化
   * @param currentBounds 当前窗口边界
   * @returns 调整后的窗口边界
   */
  static handleViewportResize(currentBounds: WindowBounds): WindowBounds {
    // 重新应用约束，确保窗口仍然可见
    if (this.needsContentVisibilityAdjustment(currentBounds)) {
      return this.adjustForContentVisibility(currentBounds)
    }
    
    // 如果不需要调整，仍然应用基本约束
    const constrainedPosition = this.constrainPosition(currentBounds.position, currentBounds.size)
    return {
      position: constrainedPosition,
      size: currentBounds.size
    }
  }
}

export default WindowPositionManager