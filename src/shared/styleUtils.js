/**
 * 共享样式处理工具
 * Canvas.jsx 和 Preview.jsx 共用，确保样式渲染一致
 */

// 构建滤镜CSS
function buildFilterCSS(style) {
  if (!style) return 'none';
  const filters = [];
  
  if (style.filterBlur) filters.push(`blur(${style.filterBlur}px)`);
  if (style.filterBrightness !== undefined && style.filterBrightness !== 100) {
    filters.push(`brightness(${style.filterBrightness}%)`);
  }
  if (style.filterContrast !== undefined && style.filterContrast !== 100) {
    filters.push(`contrast(${style.filterContrast}%)`);
  }
  if (style.filterSaturate !== undefined && style.filterSaturate !== 100) {
    filters.push(`saturate(${style.filterSaturate}%)`);
  }
  if (style.filterGrayscale) filters.push(`grayscale(${style.filterGrayscale}%)`);
  if (style.filterHueRotate) filters.push(`hue-rotate(${style.filterHueRotate}deg)`);
  if (style.filterInvert) filters.push(`invert(${style.filterInvert}%)`);
  if (style.filterSepia) filters.push(`sepia(${style.filterSepia}%)`);
  if (style.filterOpacity !== undefined && style.filterOpacity !== 100) {
    filters.push(`opacity(${style.filterOpacity}%)`);
  }
  if (style.filterDropShadowX || style.filterDropShadowY) {
    filters.push(`drop-shadow(${style.filterDropShadowX || 0}px ${style.filterDropShadowY || 0}px ${style.filterDropShadowBlur || 0}px ${style.filterDropShadowColor || '#000'})`);
  }
  
  return filters.length > 0 ? filters.join(' ') : 'none';
}

// 构建变形CSS
function buildTransformCSS(style) {
  if (!style) return 'none';
  const transforms = [];
  
  if (style.translateX || style.translateY) {
    transforms.push(`translate(${style.translateX || 0}px, ${style.translateY || 0}px)`);
  }
  if ((style.scaleX !== undefined && style.scaleX !== 1) || (style.scaleY !== undefined && style.scaleY !== 1)) {
    transforms.push(`scale(${style.scaleX ?? 1}, ${style.scaleY ?? 1})`);
  }
  if (style.rotate) {
    transforms.push(`rotate(${style.rotate}deg)`);
  }
  if (style.skewX || style.skewY) {
    transforms.push(`skew(${style.skewX || 0}deg, ${style.skewY || 0}deg)`);
  }
  
  return transforms.length > 0 ? transforms.join(' ') : 'none';
}

/**
 * 构建区块的容器样式（定位、尺寸、背景、边框等）
 * @param {Object} block - 区块数据
 * @param {Object} options - 配置选项
 * @param {number} options.scale - 缩放比例（百分比，默认100）
 * @param {boolean} options.isButtonBlock - 是否为按钮区块
 * @param {boolean} options.forDesigner - 是否为设计页面（影响cursor等）
 * @returns {Object} CSS样式对象
 */
function buildBlockContainerStyle(block, options = {}) {
  const { scale = 100, isButtonBlock = false, forDesigner = false } = options;
  const s = scale / 100;
  const style = block.style || {};
  
  // 默认背景色 - 设计页和预览页统一使用白色（除非明确设置了其他颜色）
  const defaultBgColor = '#ffffff';
  
  const containerStyle = {
    position: 'absolute',
    left: block.x * s,
    top: block.y * s,
    width: block.width * s,
    height: block.autoHeight ? 'auto' : block.height * s,
    minHeight: block.autoHeight ? block.height * s : undefined,
    
    // === 层级 ===
    zIndex: style.zIndex || 0,
    
    // === 盒模型 ===
    boxSizing: style.boxSizing || 'border-box',
    overflow: style.overflow || (forDesigner ? 'visible' : 'hidden'),
    
    // === 背景 ===
    // 按钮区块背景色由ButtonRenderer处理，外层设为透明
    // 设计页和预览页统一使用相同的默认背景色
    backgroundColor: isButtonBlock ? 'transparent' : (style.backgroundColor || defaultBgColor),
    backgroundImage: style.backgroundImage || 'none',
    backgroundSize: style.backgroundSize || 'auto',
    backgroundPosition: style.backgroundPosition || 'center',
    backgroundRepeat: style.backgroundRepeat || 'no-repeat',
    opacity: style.opacity !== undefined ? style.opacity : 1,
    
    // === 边框 - 统一设置 ===
    borderStyle: style.borderStyle || 'solid',
    borderWidth: style.borderWidth !== undefined ? style.borderWidth : 1,
    borderColor: style.borderColor || '#cccccc',
    borderRadius: style.borderRadius || 0,
    
    // === 阴影 ===
    boxShadow: style.boxShadow || 'none',
    
    // === 滤镜 ===
    filter: buildFilterCSS(style),
    
    // === 过渡 ===
    transitionProperty: style.transitionProperty || 'all',
    transitionDuration: (style.transitionDuration || 0) + 'ms',
    transitionTimingFunction: style.transitionTimingFunction || 'linear',
    transitionDelay: (style.transitionDelay || 0) + 'ms',
    
    // === 变形 ===
    transform: buildTransformCSS(style),
    transformOrigin: style.transformOrigin || 'center center',
  };
  
  // 设计页面特有的cursor
  if (forDesigner) {
    containerStyle.cursor = 'move';
  }
  
  // === 边框 - 四边分别设置（覆盖统一设置）===
  if (style.borderTopWidth !== undefined) containerStyle.borderTopWidth = style.borderTopWidth;
  if (style.borderRightWidth !== undefined) containerStyle.borderRightWidth = style.borderRightWidth;
  if (style.borderBottomWidth !== undefined) containerStyle.borderBottomWidth = style.borderBottomWidth;
  if (style.borderLeftWidth !== undefined) containerStyle.borderLeftWidth = style.borderLeftWidth;
  if (style.borderTopStyle) containerStyle.borderTopStyle = style.borderTopStyle;
  if (style.borderRightStyle) containerStyle.borderRightStyle = style.borderRightStyle;
  if (style.borderBottomStyle) containerStyle.borderBottomStyle = style.borderBottomStyle;
  if (style.borderLeftStyle) containerStyle.borderLeftStyle = style.borderLeftStyle;
  if (style.borderTopColor) containerStyle.borderTopColor = style.borderTopColor;
  if (style.borderRightColor) containerStyle.borderRightColor = style.borderRightColor;
  if (style.borderBottomColor) containerStyle.borderBottomColor = style.borderBottomColor;
  if (style.borderLeftColor) containerStyle.borderLeftColor = style.borderLeftColor;
  
  // === 圆角 - 四角分别设置（覆盖统一设置）===
  if (style.borderTopLeftRadius !== undefined) containerStyle.borderTopLeftRadius = style.borderTopLeftRadius;
  if (style.borderTopRightRadius !== undefined) containerStyle.borderTopRightRadius = style.borderTopRightRadius;
  if (style.borderBottomLeftRadius !== undefined) containerStyle.borderBottomLeftRadius = style.borderBottomLeftRadius;
  if (style.borderBottomRightRadius !== undefined) containerStyle.borderBottomRightRadius = style.borderBottomRightRadius;
  
  return containerStyle;
}

/**
 * 构建区块的内容样式（文字、内边距等）
 * @param {Object} block - 区块数据
 * @param {Object} options - 配置选项
 * @param {number} options.scale - 缩放比例（百分比，默认100）
 * @returns {Object} CSS样式对象
 */
function buildBlockContentStyle(block, options = {}) {
  const { scale = 100 } = options;
  const s = scale / 100;
  const style = block.style || {};
  
  // 内边距值处理（支持缩放）
  const paddingTop = (style.paddingTop !== undefined ? style.paddingTop : 8) * s;
  const paddingRight = (style.paddingRight !== undefined ? style.paddingRight : 8) * s;
  const paddingBottom = (style.paddingBottom !== undefined ? style.paddingBottom : 8) * s;
  const paddingLeft = (style.paddingLeft !== undefined ? style.paddingLeft : 8) * s;
  
  // 字体大小处理（支持缩放）
  const fontSize = (style.fontSize || 14) * s;
  
  return {
    width: '100%',
    height: '100%',
    
    // === 内边距 ===
    paddingTop: paddingTop,
    paddingRight: paddingRight,
    paddingBottom: paddingBottom,
    paddingLeft: paddingLeft,
    
    // === 排版 ===
    fontFamily: style.fontFamily || 'inherit',
    fontSize: fontSize,
    fontWeight: style.fontWeight || 'normal',
    fontStyle: style.fontStyle || 'normal',
    lineHeight: style.lineHeight || 1.5,
    letterSpacing: style.letterSpacing !== undefined ? style.letterSpacing * s : 0,
    textAlign: style.textAlign || 'left',
    textDecoration: style.textDecoration || 'none',
    textTransform: style.textTransform || 'none',
    color: style.color || '#333333',
    textShadow: style.textShadow || 'none',
    
    // === 其他 ===
    overflow: 'auto',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
    outline: 'none',
  };
}

/**
 * 计算画布需要的最小高度（根据区块位置）
 * @param {Array} blocks - 区块数组
 * @param {number} defaultMinHeight - 默认最小高度
 * @returns {number} 画布高度
 */
function calculateCanvasHeight(blocks, defaultMinHeight = 800) {
  if (!blocks || blocks.length === 0) return defaultMinHeight;
  
  const maxBottom = blocks.reduce((max, block) => {
    const bottom = block.y + block.height + 50; // 50px 底部边距
    return bottom > max ? bottom : max;
  }, defaultMinHeight);
  
  return maxBottom;
}

/**
 * 画布配置
 */
const CANVAS_CONFIG = {
  PC: { width: 1200, minHeight: 800, label: 'PC端 (宽度1200)' },
  Mobile: { width: 360, minHeight: 640, label: '手机端 (宽度360)' }
};

/**
 * 获取画布配置
 * @param {string} canvasType - 画布类型（PC/Mobile）
 * @returns {Object} 画布配置
 */
function getCanvasConfig(canvasType) {
  return CANVAS_CONFIG[canvasType] || CANVAS_CONFIG.PC;
}

// 导出到全局（供浏览器环境使用）
window.StyleUtils = {
  buildFilterCSS,
  buildTransformCSS,
  buildBlockContainerStyle,
  buildBlockContentStyle,
  calculateCanvasHeight,
  getCanvasConfig,
  CANVAS_CONFIG
};

console.log('[DND2] shared/styleUtils.js 加载完成 - StyleUtils已挂载到window');
