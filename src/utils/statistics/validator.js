/**
 * 统计模块 - 数据校验工具类
 * 提供数据完整性校验和依赖关系管理
 */

const StatisticsValidator = {
  /**
   * 校验统计配置完整性
   * @param {Object} config - 统计配置
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validateConfig(config) {
    const errors = [];

    // 基础校验
    if (!config.source?.formId) {
      errors.push('未选择数据来源');
    }

    if (config.direction === '纵向') {
      if (!config.timeFieldId) {
        errors.push('纵向统计必须选择时间字段');
      }
      if (!config.timeGranularity) {
        errors.push('纵向统计必须选择时间粒度');
      }
    } else if (config.direction === '横向') {
      if (!config.groupFields || config.groupFields.length === 0) {
        errors.push('横向统计必须选择至少一个划分字段');
      }
    }

    if (!config.statisticFields || config.statisticFields.length === 0) {
      errors.push('必须选择至少一个统计字段');
    }

    if (config.storageType !== '虚表' && !config.name?.trim()) {
      errors.push('实表和临时表必须设置名称');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * 校验数据源可用性
   * @param {Object} statistic - 统计表对象
   * @param {Array} forms - 表单列表
   * @param {Array} statistics - 统计表列表
   * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
   */
  async validateDataSource(statistic, forms, statistics, projectId) {
    const errors = [];
    const warnings = [];

    if (!statistic.source?.formId) {
      errors.push('数据来源未配置');
      return { valid: false, errors, warnings };
    }

    let sourceData = [];
    let sourceExists = false;

    if (statistic.source.type === '统计表') {
      const sourceStat = statistics.find(s => s.id === statistic.source.formId);
      if (!sourceStat) {
        errors.push(`源统计表"${statistic.source.formName || statistic.source.formId}"不存在或已被删除`);
      } else {
        sourceExists = true;
        sourceData = sourceStat.data || [];
        
        if (sourceData.length === 0) {
          warnings.push(`源统计表"${sourceStat.name}"暂无数据，请先更新源统计表`);
        }
      }
    } else {
      const form = forms.find(f => f.id === statistic.source.formId);
      if (!form) {
        errors.push(`源表单"${statistic.source.formName || statistic.source.formId}"不存在或已被删除`);
      } else {
        sourceExists = true;
        
        if (projectId && window.dndDB) {
          try {
            sourceData = await window.dndDB.getFormDataList(projectId, statistic.source.formId);
            if (sourceData.length === 0) {
              warnings.push(`源表单"${form.name}"暂无数据`);
            }
          } catch (e) {
            warnings.push(`无法获取源数据: ${e.message}`);
          }
        }
      }
    }

    // 校验统计字段是否存在于源数据
    if (sourceExists && sourceData.length > 0 && statistic.config?.statisticFields) {
      const sourceKeys = Object.keys(sourceData[0]);
      statistic.config.statisticFields.forEach(field => {
        if (!sourceKeys.includes(field.fieldId) && !sourceKeys.includes(field.fieldName)) {
          warnings.push(`统计字段"${field.fieldName}"在源数据中不存在`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  },

  /**
   * 校验统计结果数据完整性
   * @param {Object} statistic - 统计表对象
   * @returns {Object} { valid: boolean, issues: Array }
   */
  validateResultData(statistic) {
    const issues = [];
    const data = statistic.data || [];

    if (data.length === 0) {
      issues.push({ type: 'error', message: '统计结果为空' });
      return { valid: false, issues };
    }

    // 检查必要字段
    const direction = statistic.config?.direction;
    const statisticFields = statistic.config?.statisticFields || [];

    if (direction === '纵向') {
      // 检查期间字段
      const missingPeriod = data.filter(row => 
        row.period !== 'SUMMARY' && !row.periodName
      );
      if (missingPeriod.length > 0) {
        issues.push({ 
          type: 'warning', 
          message: `${missingPeriod.length}条记录缺少期间信息` 
        });
      }

      // 检查不完整期间
      const incompleteCount = data.filter(row => row.isComplete === false).length;
      if (incompleteCount > 0) {
        issues.push({ 
          type: 'info', 
          message: `${incompleteCount}个期间数据不完整（进行中）` 
        });
      }
    }

    // 检查统计字段值
    statisticFields.forEach(field => {
      const fieldName = field.fieldName || field.fieldId;
      const nullCount = data.filter(row => 
        row.period !== 'SUMMARY' && 
        !row._isTotal && 
        (row[fieldName] === null || row[fieldName] === undefined)
      ).length;
      
      if (nullCount > 0) {
        issues.push({ 
          type: 'warning', 
          message: `字段"${fieldName}"有${nullCount}个空值` 
        });
      }
    });

    // 检查数值异常
    statisticFields.forEach(field => {
      const fieldName = field.fieldName || field.fieldId;
      const values = data
        .filter(row => row.period !== 'SUMMARY' && !row._isTotal)
        .map(row => row[fieldName])
        .filter(v => typeof v === 'number');
      
      if (values.length > 0) {
        const negativeCount = values.filter(v => v < 0).length;
        if (negativeCount > 0) {
          issues.push({ 
            type: 'info', 
            message: `字段"${fieldName}"包含${negativeCount}个负值` 
          });
        }
      }
    });

    return {
      valid: issues.filter(i => i.type === 'error').length === 0,
      issues
    };
  },

  /**
   * 获取依赖关系树
   * @param {string} statisticId - 统计表ID
   * @param {Array} statistics - 所有统计表
   * @returns {Object} 依赖关系树
   */
  getDependencyTree(statisticId, statistics) {
    const stat = statistics.find(s => s.id === statisticId);
    if (!stat) return null;

    // 上游依赖（该统计表依赖的）
    let upstream = null;
    if (stat.source?.type === '统计表' && stat.source?.formId) {
      const sourceStat = statistics.find(s => s.id === stat.source.formId);
      if (sourceStat) {
        upstream = {
          id: sourceStat.id,
          name: sourceStat.name,
          storageType: sourceStat.storageType,
          lastUpdated: sourceStat.lastUpdated
        };
      }
    }

    // 下游依赖（依赖该统计表的）
    const downstream = (stat.dependents || [])
      .map(depId => statistics.find(s => s.id === depId))
      .filter(Boolean)
      .map(s => ({
        id: s.id,
        name: s.name,
        storageType: s.storageType,
        lastUpdated: s.lastUpdated
      }));

    return {
      current: {
        id: stat.id,
        name: stat.name,
        storageType: stat.storageType,
        lastUpdated: stat.lastUpdated
      },
      upstream,
      downstream
    };
  },

  /**
   * 获取需要级联更新的统计表列表
   * @param {string} statisticId - 统计表ID
   * @param {Array} statistics - 所有统计表
   * @returns {Array} 需要更新的统计表ID列表（按更新顺序）
   */
  getCascadeUpdateList(statisticId, statistics) {
    const updateList = [];
    const visited = new Set();

    const traverse = (id) => {
      if (visited.has(id)) return;
      visited.add(id);

      const stat = statistics.find(s => s.id === id);
      if (!stat) return;

      updateList.push(id);

      // 递归处理下游依赖
      (stat.dependents || []).forEach(depId => traverse(depId));
    };

    traverse(statisticId);
    return updateList;
  },

  /**
   * 检查是否存在循环依赖
   * @param {string} sourceId - 源统计表ID
   * @param {string} targetId - 目标统计表ID（要依赖的）
   * @param {Array} statistics - 所有统计表
   * @returns {boolean} 是否存在循环依赖
   */
  hasCircularDependency(sourceId, targetId, statistics) {
    // 检查target是否直接或间接依赖source
    const visited = new Set();

    const checkDependency = (id) => {
      if (id === sourceId) return true;
      if (visited.has(id)) return false;
      visited.add(id);

      const stat = statistics.find(s => s.id === id);
      if (!stat) return false;

      // 检查下游依赖
      return (stat.dependents || []).some(depId => checkDependency(depId));
    };

    return checkDependency(targetId);
  }
};

// 导出到全局
window.StatisticsValidator = StatisticsValidator;
