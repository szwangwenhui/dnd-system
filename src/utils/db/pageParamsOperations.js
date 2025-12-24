// DND2 数据库模块 - 页面参数配置操作
// 功能：页面读参配置的CRUD操作
// 
// API列表 (4个):
// - getPageParams(projectId, roleId, pageId) - 获取页面参数配置
// - updatePageParams(projectId, roleId, pageId, params) - 更新页面参数配置
// - getAvailableParams() - 获取系统预定义参数清单
// - validatePageParams(params) - 验证参数配置

(function() {
  const proto = window.DNDDatabase.prototype;

  // ==================== 系统预定义参数清单 ====================
  
  /**
   * 获取系统预定义参数清单
   * @returns {Array} 参数清单
   */
  proto.getAvailableParams = function() {
    return [
      {
        name: 'userId',
        label: '用户ID',
        description: '当前登录用户的唯一标识',
        sources: ['URL', 'LocalStorage', 'SessionStorage'],
        defaultSource: 'LocalStorage',
        dataType: 'string'
      },
      {
        name: 'recordId',
        label: '记录ID',
        description: '当前操作的数据记录ID（如查看详情页）',
        sources: ['URL'],
        defaultSource: 'URL',
        dataType: 'string'
      },
      {
        name: 'formId',
        label: '表单ID',
        description: '当前操作的表单ID',
        sources: ['URL'],
        defaultSource: 'URL',
        dataType: 'string'
      },
      {
        name: 'pageId',
        label: '页面ID',
        description: '当前页面的ID',
        sources: ['URL'],
        defaultSource: 'URL',
        dataType: 'string'
      },
      {
        name: 'roleId',
        label: '角色ID',
        description: '当前用户的角色标识',
        sources: ['URL', 'LocalStorage', 'SessionStorage'],
        defaultSource: 'LocalStorage',
        dataType: 'string'
      }
    ];
  };

  /**
   * 获取页面参数配置
   * @param {string} projectId - 项目ID
   * @param {string} roleId - 角色ID
   * @param {string} pageId - 页面ID
   * @returns {Promise<Object>} 参数配置
   */
  proto.getPageParams = async function(projectId, roleId, pageId) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const role = project.roles?.find(r => r.id === roleId);
    if (!role) {
      throw new Error('角色不存在');
    }

    const page = role.pages?.find(p => p.id === pageId);
    if (!page) {
      throw new Error('页面不存在');
    }

    // 返回页面的参数配置，如果没有则返回默认结构
    return page.paramConfig || {
      requiredParams: [],      // 必需参数列表
      optionalParams: [],      // 可选参数列表
      customParams: [],        // 自定义参数列表
      missingAction: 'error',  // 参数缺失处理：'error' | 'redirect' | 'default'
      redirectPageId: '',      // 缺失时跳转的页面ID
      defaultValues: {}        // 默认值映射
    };
  };

  /**
   * 更新页面参数配置
   * @param {string} projectId - 项目ID
   * @param {string} roleId - 角色ID
   * @param {string} pageId - 页面ID
   * @param {Object} paramConfig - 参数配置
   * @returns {Promise<Object>} 更新后的页面
   */
  proto.updatePageParams = async function(projectId, roleId, pageId, paramConfig) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const roleIndex = project.roles?.findIndex(r => r.id === roleId);
    if (roleIndex === -1) {
      throw new Error('角色不存在');
    }

    const pageIndex = project.roles[roleIndex].pages?.findIndex(p => p.id === pageId);
    if (pageIndex === -1) {
      throw new Error('页面不存在');
    }

    // 更新参数配置
    project.roles[roleIndex].pages[pageIndex].paramConfig = {
      requiredParams: paramConfig.requiredParams || [],
      optionalParams: paramConfig.optionalParams || [],
      customParams: paramConfig.customParams || [],
      missingAction: paramConfig.missingAction || 'error',
      redirectPageId: paramConfig.redirectPageId || '',
      defaultValues: paramConfig.defaultValues || {}
    };

    project.roles[roleIndex].pages[pageIndex].updatedAt = new Date().toISOString();
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return project.roles[roleIndex].pages[pageIndex];
  };

  /**
   * 验证参数配置
   * @param {Object} paramConfig - 参数配置
   * @returns {Object} 验证结果 { valid: boolean, errors: string[] }
   */
  proto.validatePageParams = function(paramConfig) {
    const errors = [];

    // 检查必需参数
    if (paramConfig.requiredParams) {
      paramConfig.requiredParams.forEach(param => {
        if (!param.name) {
          errors.push('必需参数缺少名称');
        }
        if (!param.source) {
          errors.push(`参数 ${param.name} 缺少来源配置`);
        }
      });
    }

    // 检查自定义参数
    if (paramConfig.customParams) {
      paramConfig.customParams.forEach(param => {
        if (!param.name) {
          errors.push('自定义参数缺少名称');
        }
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(param.name)) {
          errors.push(`参数名 ${param.name} 格式不正确（只能包含字母、数字、下划线，且不能以数字开头）`);
        }
      });
    }

    // 检查缺失处理配置
    if (paramConfig.missingAction === 'redirect' && !paramConfig.redirectPageId) {
      errors.push('选择跳转处理时必须指定跳转页面');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  console.log('[DND2] db/pageParamsOperations.js 加载完成');
})();
