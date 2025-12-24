// DND2 数据库模块 - 模板管理操作
// 功能：页面模板和区块模板的CRUD操作
// 
// API列表 (12个):
// 页面模板:
// - getPageTemplatesByProjectId(projectId)
// - addPageTemplate(projectId, template)
// - updatePageTemplate(projectId, templateId, updates)
// - deletePageTemplate(projectId, templateId)
// - getPageTemplateById(projectId, templateId)
// - createPageFromTemplate(projectId, templateId, options)
// 区块模板:
// - getBlockTemplatesByProjectId(projectId)
// - addBlockTemplate(projectId, template)
// - updateBlockTemplate(projectId, templateId, updates)
// - deleteBlockTemplate(projectId, templateId)
// - getBlockTemplateById(projectId, templateId)
// - createBlockFromTemplate(templateId, options)

(function() {
  const proto = window.DNDDatabase.prototype;

  // ==================== 页面模板管理 ====================

  /**
   * 获取项目的所有页面模板
   * @param {string} projectId - 项目ID
   * @returns {Promise<Array>} 页面模板列表
   */
  proto.getPageTemplatesByProjectId = async function(projectId) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }
    return project.pageTemplates || [];
  };

  /**
   * 添加页面模板
   * @param {string} projectId - 项目ID
   * @param {Object} template - 模板对象
   * @param {string} template.name - 模板名称
   * @param {string} template.description - 模板描述
   * @param {string} template.sourcePageId - 来源页面ID
   * @param {object} template.style - 样式信息
   * @param {array} template.blocks - 区块列表
   * @param {object} template.functions - 功能信息
   * @returns {Promise<Object>} 新建的模板
   */
  proto.addPageTemplate = async function(projectId, template) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    // 初始化pageTemplates数组
    if (!project.pageTemplates) {
      project.pageTemplates = [];
    }

    // 检查模板名称是否重复
    const nameExists = project.pageTemplates.some(t => t.name === template.name);
    if (nameExists) {
      throw new Error('模板名称已存在，请使用其他名称');
    }

    // 生成模板对象
    const newTemplate = {
      id: `PT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: template.name,
      description: template.description || '',
      sourcePageId: template.sourcePageId,
      style: template.style || {},
      blocks: template.blocks || [],
      functions: template.functions || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    project.pageTemplates.push(newTemplate);
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return newTemplate;
  };

  /**
   * 更新页面模板
   * @param {string} projectId - 项目ID
   * @param {string} templateId - 模板ID
   * @param {Object} updates - 更新内容
   * @returns {Promise<Object>} 更新后的模板
   */
  proto.updatePageTemplate = async function(projectId, templateId, updates) {
    const project = await this.getProjectById(projectId);
    if (!project || !project.pageTemplates) {
      throw new Error('项目不存在或无模板');
    }

    const templateIndex = project.pageTemplates.findIndex(t => t.id === templateId);
    if (templateIndex === -1) {
      throw new Error('模板不存在');
    }

    // 检查名称重复（排除自身）
    if (updates.name) {
      const nameExists = project.pageTemplates.some(
        t => t.name === updates.name && t.id !== templateId
      );
      if (nameExists) {
        throw new Error('模板名称已存在');
      }
    }

    project.pageTemplates[templateIndex] = {
      ...project.pageTemplates[templateIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    project.updatedAt = new Date().toISOString();
    await this.updateProject(project);
    return project.pageTemplates[templateIndex];
  };

  /**
   * 删除页面模板
   * @param {string} projectId - 项目ID
   * @param {string} templateId - 模板ID
   * @returns {Promise<boolean>} 是否成功
   */
  proto.deletePageTemplate = async function(projectId, templateId) {
    const project = await this.getProjectById(projectId);
    if (!project || !project.pageTemplates) {
      throw new Error('项目不存在或无模板');
    }

    const templateIndex = project.pageTemplates.findIndex(t => t.id === templateId);
    if (templateIndex === -1) {
      throw new Error('模板不存在');
    }

    project.pageTemplates.splice(templateIndex, 1);
    project.updatedAt = new Date().toISOString();
    await this.updateProject(project);
    return true;
  };

  /**
   * 根据ID获取页面模板
   * @param {string} projectId - 项目ID
   * @param {string} templateId - 模板ID
   * @returns {Promise<Object|null>} 模板对象
   */
  proto.getPageTemplateById = async function(projectId, templateId) {
    const project = await this.getProjectById(projectId);
    if (!project || !project.pageTemplates) {
      return null;
    }
    return project.pageTemplates.find(t => t.id === templateId) || null;
  };

  /**
   * 从模板创建页面数据
   * @param {string} projectId - 项目ID
   * @param {string} templateId - 模板ID
   * @param {Object} options - 选项
   * @param {boolean} options.copyStyle - 是否复用样式
   * @param {boolean} options.copyFunctions - 是否复用功能
   * @returns {Promise<Object>} 页面数据（不含id和name，由调用方设置）
   */
  proto.createPageFromTemplate = async function(projectId, templateId, options = {}) {
    const template = await this.getPageTemplateById(projectId, templateId);
    if (!template) {
      throw new Error('模板不存在');
    }

    const { copyStyle = true, copyFunctions = true } = options;

    const pageData = {
      blocks: []
    };

    // 复制区块
    if (template.blocks && template.blocks.length > 0) {
      pageData.blocks = template.blocks.map(block => {
        const newBlock = { ...block };
        // 生成新的区块ID
        newBlock.id = `BLK-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        
        if (!copyStyle) {
          // 不复用样式时，清除样式相关属性
          delete newBlock.style;
          delete newBlock.x;
          delete newBlock.y;
          delete newBlock.width;
          delete newBlock.height;
        }
        
        if (!copyFunctions) {
          // 不复用功能时，清除功能相关属性
          delete newBlock.dataBinding;
          delete newBlock.interaction;
          delete newBlock.buttonConfig;
          delete newBlock.formConfig;
        }
        
        return newBlock;
      });
    }

    // 复制页面级样式
    if (copyStyle && template.style) {
      pageData.style = { ...template.style };
    }

    // 复制页面级功能配置
    if (copyFunctions && template.functions) {
      pageData.functions = { ...template.functions };
    }

    return pageData;
  };

  // ==================== 区块模板管理 ====================

  /**
   * 获取项目的所有区块模板
   * @param {string} projectId - 项目ID
   * @returns {Promise<Array>} 区块模板列表
   */
  proto.getBlockTemplatesByProjectId = async function(projectId) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }
    return project.blockTemplates || [];
  };

  /**
   * 添加区块模板
   * @param {string} projectId - 项目ID
   * @param {Object} template - 模板对象
   * @param {string} template.name - 模板名称
   * @param {string} template.description - 模板描述
   * @param {string} template.blockType - 区块类型
   * @param {object} template.style - 样式信息
   * @param {array} template.children - 子区块
   * @param {object} template.functions - 功能信息
   * @returns {Promise<Object>} 新建的模板
   */
  proto.addBlockTemplate = async function(projectId, template) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    // 初始化blockTemplates数组
    if (!project.blockTemplates) {
      project.blockTemplates = [];
    }

    // 检查模板名称是否重复
    const nameExists = project.blockTemplates.some(t => t.name === template.name);
    if (nameExists) {
      throw new Error('模板名称已存在，请使用其他名称');
    }

    // 生成模板对象
    const newTemplate = {
      id: `BT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: template.name,
      description: template.description || '',
      sourceBlockId: template.sourceBlockId || '',
      blockType: template.blockType,
      style: template.style || {},
      children: template.children || [],
      functions: {
        dataBinding: template.functions?.dataBinding || null,
        interaction: template.functions?.interaction || null,
        buttonConfig: template.functions?.buttonConfig || null
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    project.blockTemplates.push(newTemplate);
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return newTemplate;
  };

  /**
   * 更新区块模板
   * @param {string} projectId - 项目ID
   * @param {string} templateId - 模板ID
   * @param {Object} updates - 更新内容
   * @returns {Promise<Object>} 更新后的模板
   */
  proto.updateBlockTemplate = async function(projectId, templateId, updates) {
    const project = await this.getProjectById(projectId);
    if (!project || !project.blockTemplates) {
      throw new Error('项目不存在或无模板');
    }

    const templateIndex = project.blockTemplates.findIndex(t => t.id === templateId);
    if (templateIndex === -1) {
      throw new Error('模板不存在');
    }

    // 检查名称重复（排除自身）
    if (updates.name) {
      const nameExists = project.blockTemplates.some(
        t => t.name === updates.name && t.id !== templateId
      );
      if (nameExists) {
        throw new Error('模板名称已存在');
      }
    }

    project.blockTemplates[templateIndex] = {
      ...project.blockTemplates[templateIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    project.updatedAt = new Date().toISOString();
    await this.updateProject(project);
    return project.blockTemplates[templateIndex];
  };

  /**
   * 删除区块模板
   * @param {string} projectId - 项目ID
   * @param {string} templateId - 模板ID
   * @returns {Promise<boolean>} 是否成功
   */
  proto.deleteBlockTemplate = async function(projectId, templateId) {
    const project = await this.getProjectById(projectId);
    if (!project || !project.blockTemplates) {
      throw new Error('项目不存在或无模板');
    }

    const templateIndex = project.blockTemplates.findIndex(t => t.id === templateId);
    if (templateIndex === -1) {
      throw new Error('模板不存在');
    }

    project.blockTemplates.splice(templateIndex, 1);
    project.updatedAt = new Date().toISOString();
    await this.updateProject(project);
    return true;
  };

  /**
   * 根据ID获取区块模板
   * @param {string} projectId - 项目ID
   * @param {string} templateId - 模板ID
   * @returns {Promise<Object|null>} 模板对象
   */
  proto.getBlockTemplateById = async function(projectId, templateId) {
    const project = await this.getProjectById(projectId);
    if (!project || !project.blockTemplates) {
      return null;
    }
    return project.blockTemplates.find(t => t.id === templateId) || null;
  };

  /**
   * 从模板创建区块数据
   * @param {string} projectId - 项目ID
   * @param {string} templateId - 模板ID
   * @param {Object} options - 选项
   * @param {boolean} options.copyStyle - 是否复用样式
   * @param {boolean} options.copyFunctions - 是否复用功能
   * @param {number} options.x - 新区块的X坐标
   * @param {number} options.y - 新区块的Y坐标
   * @returns {Promise<Object>} 区块数据
   */
  proto.createBlockFromTemplate = async function(projectId, templateId, options = {}) {
    const template = await this.getBlockTemplateById(projectId, templateId);
    if (!template) {
      throw new Error('模板不存在');
    }

    const { copyStyle = true, copyFunctions = true, x = 50, y = 50 } = options;

    // 生成新区块ID
    const newBlockId = `BLK-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const blockData = {
      id: newBlockId,
      type: template.blockType,
      x: x,
      y: y,
      width: 200,
      height: 100
    };

    // 复用样式
    if (copyStyle) {
      if (template.style) {
        Object.assign(blockData, template.style);
      }
      // 复制子区块（属于样式）
      if (template.children && template.children.length > 0) {
        blockData.children = template.children.map((child, index) => ({
          ...child,
          id: `${newBlockId}-${index}`
        }));
      }
    }

    // 复用功能
    if (copyFunctions && template.functions) {
      if (template.functions.dataBinding) {
        blockData.dataBinding = { ...template.functions.dataBinding };
      }
      if (template.functions.interaction) {
        blockData.interaction = { ...template.functions.interaction };
      }
      if (template.functions.buttonConfig) {
        blockData.buttonConfig = { ...template.functions.buttonConfig };
      }
    }

    return blockData;
  };

  console.log('[DND2] db/templateOperations.js 加载完成');
})();
