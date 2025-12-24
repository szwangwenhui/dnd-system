// DND2 页面设计器 - 工具函数
// 原文件: src/designer/PageDesigner.jsx 中的纯函数
// Phase 5 拆分: 文件 3/5
//
// 提供可独立使用的工具函数

window.DesignerUtils = {
  /**
   * 生成区块ID
   * @param {Array} blocks - 现有区块列表
   * @returns {string} 新区块ID
   */
  generateBlockId: function(blocks) {
    if (!blocks || blocks.length === 0) return 'B001';
    const maxNum = blocks.reduce((max, block) => {
      const num = parseInt(block.id.substring(1));
      return num > max ? num : max;
    }, 0);
    return 'B' + (maxNum + 1).toString().padStart(3, '0');
  },

  /**
   * 生成子区块ID
   * @param {string} parentBlockId - 父区块ID
   * @param {number} index - 索引
   * @returns {string} 子区块ID
   */
  generateChildBlockId: function(parentBlockId, index) {
    return `${parentBlockId}-C${String(index).padStart(3, '0')}`;
  },

  /**
   * 获取所有下级区块（递归）
   * @param {string} blockId - 目标区块ID
   * @param {Array} allBlocks - 所有区块
   * @returns {Array} 下级区块列表
   */
  getAllDescendants: function(blockId, allBlocks) {
    const descendants = [];
    const children = allBlocks.filter(b => b.parentId === blockId);
    children.forEach(child => {
      descendants.push(child);
      descendants.push(...this.getAllDescendants(child.id, allBlocks));
    });
    return descendants;
  },

  /**
   * 创建默认区块
   * @param {string} id - 区块ID
   * @param {Object} options - 选项
   * @returns {Object} 新区块对象
   */
  createDefaultBlock: function(id, options = {}) {
    return {
      id,
      type: options.type || '显示',
      level: options.level || 1,
      parentId: options.parentId || null,
      x: options.x || 10,
      y: options.y || 10,
      width: options.width || 100,
      height: options.height || 100,
      style: {
        backgroundColor: '#ffffff',
        borderColor: '#cccccc',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 0,
        ...options.style
      },
      createdAt: new Date().toISOString(),
      ...options.extra
    };
  },

  /**
   * 创建提示区块（用于子区块生成）
   * @param {Object} params - 参数
   * @returns {Object} 提示区块对象
   */
  createPromptBlock: function(params) {
    const { id, parentId, parentLevel, fieldId, x, y, width, height, content, zIndex } = params;
    return {
      id,
      type: '显示',
      parentId,
      level: (parentLevel || 1) + 1,
      subType: params.subType || 'prompt',
      fieldId,
      x,
      y,
      relativeX: params.relativeX,
      relativeY: params.relativeY,
      width,
      height,
      content,
      style: {
        backgroundColor: 'transparent',
        color: '#374151',
        fontSize: 12,
        textAlign: 'right',
        padding: 4,
        borderWidth: 0,
        zIndex: zIndex ?? 0
      },
      createdAt: new Date().toISOString()
    };
  },

  /**
   * 创建输入区块（用于子区块生成）
   * @param {Object} params - 参数
   * @returns {Object} 输入区块对象
   */
  createInputBlock: function(params) {
    const { id, parentId, parentLevel, fieldId, x, y, width, height, placeholder, zIndex } = params;
    return {
      id,
      type: '显示',
      parentId,
      level: (parentLevel || 1) + 1,
      subType: params.subType || 'input',
      fieldId,
      isPrimaryKey: params.isPrimaryKey || false,
      x,
      y,
      relativeX: params.relativeX,
      relativeY: params.relativeY,
      width,
      height,
      content: '',
      placeholder,
      style: {
        backgroundColor: '#ffffff',
        borderColor: '#d1d5db',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 4,
        padding: 4,
        fontSize: 12,
        zIndex: zIndex ?? 0
      },
      createdAt: new Date().toISOString()
    };
  },

  /**
   * 创建提交按钮区块
   * @param {Object} params - 参数
   * @returns {Object} 提交按钮区块对象
   */
  createSubmitBlock: function(params) {
    const { id, parentId, parentLevel, x, y, width, height, content, zIndex } = params;
    return {
      id,
      type: '显示',
      parentId,
      level: (parentLevel || 1) + 1,
      subType: params.subType || 'submit',
      flowId: params.flowId,
      flowName: params.flowName,
      x,
      y,
      relativeX: params.relativeX,
      relativeY: params.relativeY,
      width,
      height: height || 32,
      content: content || '确认提交',
      style: {
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        borderRadius: 4,
        borderWidth: 0,
        padding: 4,
        cursor: 'pointer',
        zIndex: zIndex ?? 0
      },
      createdAt: new Date().toISOString()
    };
  },

  /**
   * 滚动到指定区块
   * @param {string} blockId - 区块ID
   * @param {Array} blocks - 区块列表
   * @param {number} scale - 缩放比例
   */
  scrollToBlock: function(blockId, blocks, scale) {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    const canvasContainer = document.querySelector('.flex-1.overflow-auto.bg-gray-200');
    if (!canvasContainer) return;
    
    const containerHeight = canvasContainer.clientHeight;
    const blockY = block.y * (scale / 100);
    const blockHeight = block.height * (scale / 100);
    const targetScrollTop = blockY - (containerHeight / 2) + (blockHeight / 2) + 30;
    
    canvasContainer.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth'
    });
  }
};

console.log('[DND2] designer/designerUtils.js 加载完成');
