/**
 * 统计模块 - 入口文件
 * 组装各子模块，导出完整的 StatisticsEngine
 * 
 * 依赖文件（需按顺序加载）：
 * 1. timeUtils.js       - 时间处理工具
 * 2. core.js            - 聚合函数和数据过滤
 * 3. verticalStats.js   - 纵向统计
 * 4. horizontalStats.js - 横向统计
 * 5. index.js           - 本文件（最后加载）
 */

/**
 * 统计计算引擎
 * 整合所有统计功能的统一接口
 */
class StatisticsEngine {
  constructor() {
    // 引用子模块
    this.timeUtils = window.StatisticsTimeUtils;
    this.core = window.StatisticsCore;
    this.vertical = window.VerticalStatistics;
    this.horizontal = window.HorizontalStatistics;
  }

  // ========== 时间工具代理方法 ==========
  
  getGranularityValue(date, granularity) {
    return this.timeUtils.getGranularityValue(date, granularity);
  }

  getPreviousPeriod(periodValue, granularity) {
    return this.timeUtils.getPreviousPeriod(periodValue, granularity);
  }

  getComparePeriod(periodValue, granularity, compareType) {
    return this.timeUtils.getComparePeriod(periodValue, granularity, compareType);
  }

  getPeriodDisplayName(periodValue, granularity) {
    return this.timeUtils.getPeriodDisplayName(periodValue, granularity);
  }

  getCurrentPeriod(granularity) {
    return this.timeUtils.getCurrentPeriod(granularity);
  }

  isPeriodComplete(periodValue, granularity) {
    return this.timeUtils.isPeriodComplete(periodValue, granularity);
  }

  // ========== 核心功能代理方法 ==========

  aggregate(values, method) {
    return this.core.aggregate(values, method);
  }

  applyFilters(data, filters) {
    return this.core.applyFilters(data, filters);
  }

  // ========== 统计执行方法 ==========

  /**
   * 执行纵向统计
   */
  executeVerticalStatistics(data, config) {
    return this.vertical.execute(data, config);
  }

  /**
   * 执行横向统计
   */
  executeHorizontalStatistics(data, config) {
    return this.horizontal.execute(data, config);
  }

  /**
   * 执行完整的统计计算
   * @param {Array} sourceData - 源数据
   * @param {Object} statisticConfig - 统计配置
   * @returns {Object} 统计结果 { data, dataRange }
   */
  execute(sourceData, statisticConfig) {
    // 1. 应用检索条件
    const filteredData = this.applyFilters(sourceData, statisticConfig.filters);

    // 2. 根据方向执行统计
    let resultData;
    if (statisticConfig.config.direction === '纵向') {
      resultData = this.executeVerticalStatistics(filteredData, statisticConfig.config);
    } else {
      resultData = this.executeHorizontalStatistics(filteredData, statisticConfig.config);
    }

    // 3. 计算数据范围（排除汇总行）
    let dataRange = null;
    if (statisticConfig.config.direction === '纵向' && resultData.length > 0) {
      const dataRows = resultData.filter(r => r.period !== 'SUMMARY');
      if (dataRows.length > 0) {
        dataRange = {
          from: dataRows[0].periodName || dataRows[0].period,
          to: dataRows[dataRows.length - 1].periodName || dataRows[dataRows.length - 1].period,
          periodCount: dataRows.length,
          incompleteCount: dataRows.filter(r => r.isComplete === false).length
        };
      }
    }

    return {
      data: resultData,
      dataRange
    };
  }
}

// 导出到全局
window.StatisticsEngine = new StatisticsEngine();

// 同时导出模块引用，方便直接访问
window.StatisticsModules = {
  TimeUtils: window.StatisticsTimeUtils,
  Core: window.StatisticsCore,
  Vertical: window.VerticalStatistics,
  Horizontal: window.HorizontalStatistics
};

console.log('[Statistics] 统计模块加载完成');
