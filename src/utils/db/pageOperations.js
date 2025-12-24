// DND2 数据库模块 - 页面管理操作
// 原文件位置: src/utils/db.js 第727-857行
// 
// API列表 (6个):
// - generatePageId(role)
// - checkPageNameExists(projectId, pageName, excludePageId)
// - addPage(projectId, roleId, page)
// - updatePage(projectId, roleId, pageId, updatedPage)
// - deletePage(projectId, roleId, pageId)
// - getPagesByRoleId(projectId, roleId)

(function() {
  const proto = window.DNDDatabase.prototype;

  // ==================== 页面管理（角色级别）====================

  /**
   * 生成页面ID（角色ID-4位序号）
   * @param {Object} role - 角色对象
   * @returns {string} 新的页面ID
   */
  proto.generatePageId = function(role) {
    if (!role.pages || role.pages.length === 0) {
      return `${role.id}-0001`;
    }

    const maxNum = role.pages.reduce((max, page) => {
      const num = parseInt(page.id.split('-')[1]);
      return num > max ? num : max;
    }, 0);

    const nextNum = maxNum + 1;
    return `${role.id}-${nextNum.toString().padStart(4, '0')}`;
  };

  /**
   * 检查页面名称是否重复（全局）
   * @param {string} projectId - 项目ID
   * @param {string} pageName - 页面名称
   * @param {string} excludePageId - 排除的页面ID（用于更新时）
   * @returns {Promise<boolean>} 是否存在重复
   */
  proto.checkPageNameExists = async function(projectId, pageName, excludePageId = null) {
    const project = await this.getProjectById(projectId);
    if (!project || !project.roles) return false;

    for (const role of project.roles) {
      if (role.pages) {
        const exists = role.pages.some(page => 
          page.name === pageName && page.id !== excludePageId
        );
        if (exists) return true;
      }
    }
    return false;
  };

  /**
   * 添加页面到角色
   * @param {string} projectId - 项目ID
   * @param {string} roleId - 角色ID
   * @param {Object} page - 页面对象
   * @returns {Promise<Object>} 新创建的页面
   */
  proto.addPage = async function(projectId, roleId, page) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const roleIndex = project.roles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) {
      throw new Error('角色不存在');
    }

    // 检查页面名称是否全局重复
    const nameExists = await this.checkPageNameExists(projectId, page.name);
    if (nameExists) {
      throw new Error('页面名称已存在，请使用其他名称（页面名称全局唯一）');
    }

    const role = project.roles[roleIndex];
    const pageId = this.generatePageId(role);

    const newPage = {
      ...page,
      id: pageId,
      createdAt: new Date().toISOString(),
      designProgress: page.designProgress || 0  // 设计进度（百分比）
    };

    role.pages = role.pages || [];
    role.pages.push(newPage);
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return newPage;
  };

  /**
   * 更新页面
   * @param {string} projectId - 项目ID
   * @param {string} roleId - 角色ID
   * @param {string} pageId - 页面ID
   * @param {Object} updatedPage - 更新的页面数据
   * @returns {Promise<Object>} 更新后的页面
   */
  proto.updatePage = async function(projectId, roleId, pageId, updatedPage) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const roleIndex = project.roles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) {
      throw new Error('角色不存在');
    }

    const pageIndex = project.roles[roleIndex].pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) {
      throw new Error('页面不存在');
    }

    // 如果修改了页面名称，检查是否全局重复
    if (updatedPage.name && updatedPage.name !== project.roles[roleIndex].pages[pageIndex].name) {
      const nameExists = await this.checkPageNameExists(projectId, updatedPage.name, pageId);
      if (nameExists) {
        throw new Error('页面名称已存在，请使用其他名称（页面名称全局唯一）');
      }
    }

    project.roles[roleIndex].pages[pageIndex] = {
      ...project.roles[roleIndex].pages[pageIndex],
      ...updatedPage
    };
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return project.roles[roleIndex].pages[pageIndex];
  };

  /**
   * 删除页面
   * @param {string} projectId - 项目ID
   * @param {string} roleId - 角色ID
   * @param {string} pageId - 页面ID
   * @returns {Promise<string>} 删除的页面ID
   */
  proto.deletePage = async function(projectId, roleId, pageId) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const roleIndex = project.roles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) {
      throw new Error('角色不存在');
    }

    project.roles[roleIndex].pages = project.roles[roleIndex].pages.filter(p => p.id !== pageId);
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return pageId;
  };

  /**
   * 获取角色的所有页面
   * @param {string} projectId - 项目ID
   * @param {string} roleId - 角色ID
   * @returns {Promise<Array>} 页面列表
   */
  proto.getPagesByRoleId = async function(projectId, roleId) {
    const role = await this.getRoleById(projectId, roleId);
    if (!role) {
      throw new Error('角色不存在');
    }
    return role.pages || [];
  };

  console.log('[DND2] db/pageOperations.js 加载完成 - 6个页面API已注册');
})();
