// DND2 数据库模块 - 统计表管理操作
// 原文件位置: src/utils/db.js 第1391-1587行
// 
// API列表 (6个):
// - getStatisticsByProjectId(projectId)
// - addStatistic(projectId, statistic)
// - updateStatistic(projectId, statisticId, updates)
// - deleteStatistic(projectId, statisticId)
// - getStatisticById(projectId, statisticId)
// - updateStatisticData(projectId, statisticId, data, dataRange)

(function() {
  const proto = window.DNDDatabase.prototype;

  // ==================== 统计表管理 ====================

  /**
   * 获取项目的所有统计表
   * @param {string} projectId - 项目ID
   * @returns {Promise<Array>} 统计表列表
   */
  proto.getStatisticsByProjectId = async function(projectId) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }
    return project.statistics || [];
  };

  /**
   * 添加统计表
   * @param {string} projectId - 项目ID
   * @param {Object} statistic - 统计表配置
   * @returns {Promise<Object>} 新建的统计表
   */
  proto.addStatistic = async function(projectId, statistic) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    // 初始化statistics数组
    if (!project.statistics) {
      project.statistics = [];
    }

    // 检查临时表数量限制（最多10个）
    if (statistic.storageType === '临时表') {
      const tempCount = project.statistics.filter(s => s.storageType === '临时表').length;
      if (tempCount >= 10) {
        throw new Error('临时表数量已达上限（10个），请删除旧的临时表或转为实表');
      }
    }

    // 生成ID
    const newStatistic = {
      ...statistic,
      id: `STAT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      dependents: []
    };

    // 如果数据来源是统计表，更新依赖关系
    if (statistic.source?.type === '统计表' && statistic.source?.formId) {
      const sourceStatIndex = project.statistics.findIndex(s => s.id === statistic.source.formId);
      if (sourceStatIndex >= 0) {
        if (!project.statistics[sourceStatIndex].dependents) {
          project.statistics[sourceStatIndex].dependents = [];
        }
        project.statistics[sourceStatIndex].dependents.push(newStatistic.id);
      }
    }

    project.statistics.push(newStatistic);
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return newStatistic;
  };

  /**
   * 更新统计表
   * @param {string} projectId - 项目ID
   * @param {string} statisticId - 统计表ID
   * @param {Object} updates - 更新内容
   * @returns {Promise<Object>} 更新后的统计表
   */
  proto.updateStatistic = async function(projectId, statisticId, updates) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const index = (project.statistics || []).findIndex(s => s.id === statisticId);
    if (index < 0) {
      throw new Error('统计表不存在');
    }

    const oldStatistic = project.statistics[index];
    
    // 如果数据来源变更，需要更新依赖关系
    if (updates.source && oldStatistic.source?.type === '统计表') {
      // 移除旧的依赖
      const oldSourceIndex = project.statistics.findIndex(s => s.id === oldStatistic.source.formId);
      if (oldSourceIndex >= 0 && project.statistics[oldSourceIndex].dependents) {
        project.statistics[oldSourceIndex].dependents = 
          project.statistics[oldSourceIndex].dependents.filter(id => id !== statisticId);
      }
    }
    
    if (updates.source?.type === '统计表' && updates.source?.formId) {
      // 添加新的依赖
      const newSourceIndex = project.statistics.findIndex(s => s.id === updates.source.formId);
      if (newSourceIndex >= 0) {
        if (!project.statistics[newSourceIndex].dependents) {
          project.statistics[newSourceIndex].dependents = [];
        }
        if (!project.statistics[newSourceIndex].dependents.includes(statisticId)) {
          project.statistics[newSourceIndex].dependents.push(statisticId);
        }
      }
    }

    project.statistics[index] = {
      ...oldStatistic,
      ...updates,
      id: statisticId,
      lastUpdated: new Date().toISOString()
    };
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return project.statistics[index];
  };

  /**
   * 删除统计表
   * @param {string} projectId - 项目ID
   * @param {string} statisticId - 统计表ID
   */
  proto.deleteStatistic = async function(projectId, statisticId) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const statistic = (project.statistics || []).find(s => s.id === statisticId);
    if (!statistic) {
      throw new Error('统计表不存在');
    }

    // 检查是否有依赖
    if (statistic.dependents && statistic.dependents.length > 0) {
      throw new Error(`该统计表被其他 ${statistic.dependents.length} 个统计表依赖，无法删除`);
    }

    // 移除对其他统计表的依赖引用
    if (statistic.source?.type === '统计表' && statistic.source?.formId) {
      const sourceIndex = project.statistics.findIndex(s => s.id === statistic.source.formId);
      if (sourceIndex >= 0 && project.statistics[sourceIndex].dependents) {
        project.statistics[sourceIndex].dependents = 
          project.statistics[sourceIndex].dependents.filter(id => id !== statisticId);
      }
    }

    project.statistics = project.statistics.filter(s => s.id !== statisticId);
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
  };

  /**
   * 获取单个统计表
   * @param {string} projectId - 项目ID
   * @param {string} statisticId - 统计表ID
   * @returns {Promise<Object>} 统计表
   */
  proto.getStatisticById = async function(projectId, statisticId) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }
    return (project.statistics || []).find(s => s.id === statisticId);
  };

  /**
   * 更新统计表数据
   * @param {string} projectId - 项目ID
   * @param {string} statisticId - 统计表ID
   * @param {Array} data - 统计数据
   * @param {Object} dataRange - 数据范围
   */
  proto.updateStatisticData = async function(projectId, statisticId, data, dataRange) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const index = (project.statistics || []).findIndex(s => s.id === statisticId);
    if (index < 0) {
      throw new Error('统计表不存在');
    }

    project.statistics[index].data = data;
    project.statistics[index].dataRange = dataRange;
    project.statistics[index].lastUpdated = new Date().toISOString();
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
  };

  console.log('[DND2] db/statisticsOperations.js 加载完成 - 6个统计API已注册');

  // ==================== 创建全局数据库实例 ====================
  // 所有操作模块加载完成后，创建实例
  window.dndDB = new window.DNDDatabase();
  console.log('[DND2] window.dndDB 实例已创建，数据库模块就绪');
})();
