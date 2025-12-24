// DND2 数据库模块 - 角色管理操作
// 原文件位置: src/utils/db.js 第155-271行
// 
// API列表 (6个):
// - generateRoleId(project)
// - addRole(projectId, role)
// - updateRole(projectId, roleId, updatedRole)
// - deleteRole(projectId, roleId)
// - getRolesByProjectId(projectId)
// - getRoleById(projectId, roleId)

(function() {
  const proto = window.DNDDatabase.prototype;

  // ==================== 角色管理 ====================

  /**
   * 生成角色ID（2位数，01-99，00为系统管理员保留）
   * @param {Object} project - 项目对象
   * @returns {string} 新的角色ID
   */
  proto.generateRoleId = function(project) {
    if (!project.roles || project.roles.length === 0) {
      return '01';
    }

    // 找出最大ID（排除系统管理员的00）
    const maxId = project.roles.reduce((max, role) => {
      const num = parseInt(role.id);
      // 跳过系统管理员ID (00)
      if (role.id === '00') return max;
      return num > max ? num : max;
    }, 0);

    const nextId = maxId + 1;
    if (nextId > 99) {
      throw new Error('角色数量已达上限（99个）');
    }

    return nextId.toString().padStart(2, '0');
  };

  /**
   * 添加角色到项目
   * @param {string} projectId - 项目ID
   * @param {Object} role - 角色对象
   * @returns {Promise<Object>} 新创建的角色
   */
  proto.addRole = async function(projectId, role) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const roleId = this.generateRoleId(project);
    
    const newRole = {
      ...role,
      id: roleId,
      createdAt: new Date().toISOString(),
      pages: [        // 角色的页面列表，默认包含首页
        {
          id: `${roleId}-0000`,
          name: '首页',
          category: '固定页',    // 页面类别：固定页/独立页
          level: 0,
          parentId: null,
          designProgress: 0,     // 设计进度（百分比）
          createdAt: new Date().toISOString()
        }
      ]
    };

    project.roles = project.roles || [];
    project.roles.push(newRole);
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return newRole;
  };

  /**
   * 更新角色
   * @param {string} projectId - 项目ID
   * @param {string} roleId - 角色ID
   * @param {Object} updatedRole - 更新的角色数据
   * @returns {Promise<Object>} 更新后的角色
   */
  proto.updateRole = async function(projectId, roleId, updatedRole) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const roleIndex = project.roles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) {
      throw new Error('角色不存在');
    }

    project.roles[roleIndex] = {
      ...project.roles[roleIndex],
      ...updatedRole
    };
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return project.roles[roleIndex];
  };

  /**
   * 删除角色
   * @param {string} projectId - 项目ID
   * @param {string} roleId - 角色ID
   * @returns {Promise<string>} 删除的角色ID
   */
  proto.deleteRole = async function(projectId, roleId) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    // 检查是否为系统管理员角色
    const role = project.roles.find(r => r.id === roleId);
    if (role && role.isSystemRole) {
      throw new Error('系统管理员角色不可删除');
    }

    project.roles = project.roles.filter(r => r.id !== roleId);
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return roleId;
  };

  /**
   * 获取项目的所有角色
   * @param {string} projectId - 项目ID
   * @returns {Promise<Array>} 角色列表
   */
  proto.getRolesByProjectId = async function(projectId) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }
    return project.roles || [];
  };

  /**
   * 根据ID获取角色
   * @param {string} projectId - 项目ID
   * @param {string} roleId - 角色ID
   * @returns {Promise<Object>} 角色对象
   */
  proto.getRoleById = async function(projectId, roleId) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }
    return project.roles.find(r => r.id === roleId);
  };

  console.log('[DND2] db/roleOperations.js 加载完成 - 6个角色API已注册');
})();
