// 按钮类型注册表 - 核心文件
// 所有按钮类型都在此注册，便于统一管理和扩展

const ButtonRegistry = {
  // 存储所有注册的按钮类型
  types: {},

  /**
   * 注册新按钮类型
   * @param {string} typeId - 按钮类型标识（唯一）
   * @param {object} config - 按钮类型配置
   * @param {string} config.label - 显示名称
   * @param {string} config.icon - 图标（emoji或图标类名）
   * @param {string} config.description - 功能描述
   * @param {string} config.category - 分类：'navigation'|'data'|'form'|'process'
   * @param {function} config.renderConfig - 渲染配置面板的函数
   * @param {function} config.execute - 执行按钮功能的函数
   * @param {function} config.validate - 验证配置是否完整的函数
   * @param {object} config.defaultConfig - 默认配置
   */
  register(typeId, config) {
    if (this.types[typeId]) {
      console.warn(`按钮类型 "${typeId}" 已存在，将被覆盖`);
    }
    
    this.types[typeId] = {
      typeId,
      label: config.label || typeId,
      icon: config.icon || '🔘',
      description: config.description || '',
      category: config.category || 'other',
      renderConfig: config.renderConfig || (() => null),
      execute: config.execute || (() => {}),
      validate: config.validate || (() => true),
      defaultConfig: config.defaultConfig || {}
    };
    
    console.log(`按钮类型 "${typeId}" 注册成功`);
  },

  /**
   * 获取按钮类型配置
   * @param {string} typeId - 按钮类型标识
   * @returns {object|null} 按钮类型配置
   */
  get(typeId) {
    return this.types[typeId] || null;
  },

  /**
   * 获取所有按钮类型（用于下拉菜单）
   * @returns {array} 按钮类型列表
   */
  getAll() {
    return Object.values(this.types).map(type => ({
      typeId: type.typeId,
      label: type.label,
      icon: type.icon,
      description: type.description,
      category: type.category
    }));
  },

  /**
   * 按分类获取按钮类型
   * @param {string} category - 分类
   * @returns {array} 该分类下的按钮类型列表
   */
  getByCategory(category) {
    return this.getAll().filter(type => type.category === category);
  },

  /**
   * 获取所有分类
   * @returns {array} 分类列表
   */
  getCategories() {
    const categories = {
      'action': { id: 'action', label: '动作按钮', icon: '⚡' },
      'process': { id: 'process', label: '流程按钮', icon: '⚙️' },
      'data': { id: 'data', label: '数据操作', icon: '📝' },
      'form': { id: 'form', label: '表单操作', icon: '📋' },
      'navigation': { id: 'navigation', label: '导航类', icon: '🔗' },
      'other': { id: 'other', label: '其他', icon: '📦' }
    };
    return Object.values(categories);
  },

  /**
   * 执行按钮
   * @param {string} typeId - 按钮类型标识
   * @param {object} buttonConfig - 按钮配置
   * @param {object} context - 执行上下文（包含projectId, pageId, 表单数据等）
   * @returns {Promise} 执行结果
   */
  async execute(typeId, buttonConfig, context) {
    const type = this.get(typeId);
    if (!type) {
      console.error(`未知的按钮类型: ${typeId}`);
      return { success: false, error: '未知的按钮类型' };
    }

    try {
      return await type.execute(buttonConfig, context);
    } catch (error) {
      console.error(`按钮执行失败:`, error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 验证按钮配置
   * @param {string} typeId - 按钮类型标识
   * @param {object} buttonConfig - 按钮配置
   * @returns {object} { valid: boolean, errors: string[] }
   */
  validate(typeId, buttonConfig) {
    const type = this.get(typeId);
    if (!type) {
      return { valid: false, errors: ['未知的按钮类型'] };
    }

    return type.validate(buttonConfig);
  },

  /**
   * 获取按钮类型的默认配置
   * @param {string} typeId - 按钮类型标识
   * @returns {object} 默认配置
   */
  getDefaultConfig(typeId) {
    const type = this.get(typeId);
    return type ? { ...type.defaultConfig } : {};
  }
};

// 挂载到全局
window.ButtonRegistry = ButtonRegistry;
