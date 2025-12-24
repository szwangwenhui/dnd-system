/**
 * 统计模块 - 核心功能
 * 提供聚合函数和数据过滤功能
 */

const StatisticsCore = {
  // ========== 聚合函数 ==========

  /**
   * 求和
   */
  sum(values) {
    return values.reduce((acc, val) => acc + (Number(val) || 0), 0);
  },

  /**
   * 平均值
   */
  avg(values) {
    if (values.length === 0) return 0;
    return this.sum(values) / values.length;
  },

  /**
   * 计数
   */
  count(values) {
    return values.length;
  },

  /**
   * 最大值
   */
  max(values) {
    if (values.length === 0) return null;
    return Math.max(...values.map(v => Number(v) || 0));
  },

  /**
   * 最小值
   */
  min(values) {
    if (values.length === 0) return null;
    return Math.min(...values.map(v => Number(v) || 0));
  },

  /**
   * 执行聚合
   * @param {Array} values - 数值数组
   * @param {string} method - 聚合方法: sum, avg, count, max, min
   * @returns {number} 聚合结果
   */
  aggregate(values, method) {
    switch (method) {
      case 'sum': return this.sum(values);
      case 'avg': return this.avg(values);
      case 'count': return this.count(values);
      case 'max': return this.max(values);
      case 'min': return this.min(values);
      default: return this.sum(values);
    }
  },

  // ========== 数据过滤 ==========

  /**
   * 应用检索条件过滤数据
   * @param {Array} data - 原始数据
   * @param {Array} filters - 检索条件
   * @returns {Array} 过滤后的数据
   */
  applyFilters(data, filters) {
    if (!filters || filters.length === 0) return data;

    return data.filter(record => {
      return filters.every(filter => {
        const value = record[filter.fieldId];
        
        if (filter.type === '指定') {
          // 指定检索：值在指定列表中
          return filter.values.includes(value) || filter.values.includes(String(value));
        } else if (filter.type === '范围') {
          // 范围检索
          const numValue = Number(value);
          const filterValue = Number(filter.value);
          
          switch (filter.operator) {
            case '=': return value == filter.value || numValue === filterValue;
            case '≠': return value != filter.value && numValue !== filterValue;
            case '>': return numValue > filterValue;
            case '≥': return numValue >= filterValue;
            case '<': return numValue < filterValue;
            case '≤': return numValue <= filterValue;
            default: return true;
          }
        }
        
        return true;
      });
    });
  }
};

// 导出到全局
window.StatisticsCore = StatisticsCore;
