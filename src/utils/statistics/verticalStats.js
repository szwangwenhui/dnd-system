/**
 * 统计模块 - 纵向统计（时间维度）
 * 提供按时间粒度分组的统计功能
 */

const VerticalStatistics = {
  /**
   * 执行纵向统计
   * @param {Array} data - 数据
   * @param {Object} config - 统计配置
   * @returns {Array} 统计结果
   */
  execute(data, config) {
    const {
      timeFieldId,
      timeGranularity,
      statisticFields,
      aggregation,
      valueTypes,
      compareTypes
    } = config;

    const TimeUtils = window.StatisticsTimeUtils;
    const Core = window.StatisticsCore;

    // 按时间粒度分组
    const groups = {};
    let validRecords = 0;
    let invalidRecords = 0;
    
    data.forEach(record => {
      const timeValue = record[timeFieldId];
      if (!timeValue) {
        invalidRecords++;
        return;
      }
      
      const periodKey = TimeUtils.getGranularityValue(timeValue, timeGranularity);
      if (!periodKey) {
        invalidRecords++;
        return;
      }
      
      validRecords++;
      if (!groups[periodKey]) {
        groups[periodKey] = [];
      }
      groups[periodKey].push(record);
    });

    // 排序期间键
    const sortedPeriods = Object.keys(groups).sort();

    if (sortedPeriods.length === 0) {
      console.warn(`纵向统计：无有效数据。有效记录: ${validRecords}, 无效记录: ${invalidRecords}`);
      return [];
    }

    // 计算每个期间的统计值
    const periodStats = {};
    sortedPeriods.forEach(period => {
      periodStats[period] = {};
      
      statisticFields.forEach(sf => {
        const values = groups[period]
          .map(r => r[sf.fieldId])
          .filter(v => v !== null && v !== undefined && !isNaN(Number(v)))
          .map(v => Number(v));
        periodStats[period][sf.fieldId] = Core.aggregate(values, aggregation);
        periodStats[period][`${sf.fieldId}_count`] = values.length;
      });
    });

    // 计算累计值（用于累计统计）
    const cumulativeStats = {};
    let cumulative = {};
    statisticFields.forEach(sf => {
      cumulative[sf.fieldId] = 0;
      cumulative[`${sf.fieldId}_count`] = 0;
    });
    
    sortedPeriods.forEach(period => {
      cumulativeStats[period] = {};
      statisticFields.forEach(sf => {
        cumulative[sf.fieldId] += periodStats[period][sf.fieldId] || 0;
        cumulative[`${sf.fieldId}_count`] += periodStats[period][`${sf.fieldId}_count`] || 0;
        cumulativeStats[period][sf.fieldId] = cumulative[sf.fieldId];
        cumulativeStats[period][`${sf.fieldId}_count`] = cumulative[`${sf.fieldId}_count`];
      });
    });

    // 生成结果
    const results = sortedPeriods.map((period, index) => {
      const row = { 
        period,
        periodName: TimeUtils.getPeriodDisplayName(period, timeGranularity),
        isComplete: TimeUtils.isPeriodComplete(period, timeGranularity)
      };
      
      statisticFields.forEach(sf => {
        const currentValue = periodStats[period][sf.fieldId];
        const recordCount = periodStats[period][`${sf.fieldId}_count`];
        
        // 绝对值
        if (valueTypes.includes('绝对值')) {
          row[sf.fieldName] = currentValue;
        }
        
        // 累计值
        if (valueTypes.includes('累计')) {
          row[`${sf.fieldName}_累计`] = cumulativeStats[period][sf.fieldId];
        }
        
        // 环比（与上一期比较）
        if (valueTypes.includes('环比')) {
          const prevPeriod = TimeUtils.getPreviousPeriod(period, timeGranularity);
          const prevValue = prevPeriod && periodStats[prevPeriod] ? periodStats[prevPeriod][sf.fieldId] : null;
          
          if (prevValue !== null && prevValue !== 0) {
            row[`${sf.fieldName}_环比`] = (currentValue - prevValue) / Math.abs(prevValue);
          } else if (prevValue === 0 && currentValue !== 0) {
            row[`${sf.fieldName}_环比`] = currentValue > 0 ? 1 : -1;
          } else {
            row[`${sf.fieldName}_环比`] = null;
          }
          
          // 环比增量（绝对值变化）
          if (prevValue !== null) {
            row[`${sf.fieldName}_环比增量`] = currentValue - prevValue;
          } else {
            row[`${sf.fieldName}_环比增量`] = null;
          }
        }
        
        // 各种同比
        (compareTypes || []).forEach(compareType => {
          const comparePeriod = TimeUtils.getComparePeriod(period, timeGranularity, compareType);
          const compareValue = comparePeriod && periodStats[comparePeriod] ? periodStats[comparePeriod][sf.fieldId] : null;
          
          if (compareValue !== null && compareValue !== 0) {
            row[`${sf.fieldName}_${compareType}`] = (currentValue - compareValue) / Math.abs(compareValue);
          } else if (compareValue === 0 && currentValue !== 0) {
            row[`${sf.fieldName}_${compareType}`] = currentValue > 0 ? 1 : -1;
          } else {
            row[`${sf.fieldName}_${compareType}`] = null;
          }
          
          // 同比增量
          if (compareValue !== null) {
            row[`${sf.fieldName}_${compareType}增量`] = currentValue - compareValue;
          } else {
            row[`${sf.fieldName}_${compareType}增量`] = null;
          }
        });
      });
      
      return row;
    });

    // 添加汇总行
    const summaryRow = {
      period: 'SUMMARY',
      periodName: '合计/平均',
      isComplete: true
    };
    
    statisticFields.forEach(sf => {
      // 计算所有期间的总和
      const allValues = sortedPeriods.map(p => periodStats[p][sf.fieldId]);
      const totalSum = allValues.reduce((a, b) => a + b, 0);
      const totalAvg = allValues.length > 0 ? totalSum / allValues.length : 0;
      
      if (valueTypes.includes('绝对值')) {
        if (aggregation === 'sum' || aggregation === 'count') {
          summaryRow[sf.fieldName] = totalSum;
        } else if (aggregation === 'avg') {
          summaryRow[sf.fieldName] = totalAvg;
        } else if (aggregation === 'max') {
          summaryRow[sf.fieldName] = Math.max(...allValues);
        } else if (aggregation === 'min') {
          summaryRow[sf.fieldName] = Math.min(...allValues);
        }
      }
      
      if (valueTypes.includes('累计')) {
        summaryRow[`${sf.fieldName}_累计`] = cumulativeStats[sortedPeriods[sortedPeriods.length - 1]][sf.fieldId];
      }
      
      // 环比和同比在汇总行显示平均值
      if (valueTypes.includes('环比')) {
        const ratios = results.map(r => r[`${sf.fieldName}_环比`]).filter(v => v !== null);
        summaryRow[`${sf.fieldName}_环比`] = ratios.length > 0 ? ratios.reduce((a, b) => a + b, 0) / ratios.length : null;
        summaryRow[`${sf.fieldName}_环比增量`] = null;
      }
      
      (compareTypes || []).forEach(compareType => {
        const ratios = results.map(r => r[`${sf.fieldName}_${compareType}`]).filter(v => v !== null);
        summaryRow[`${sf.fieldName}_${compareType}`] = ratios.length > 0 ? ratios.reduce((a, b) => a + b, 0) / ratios.length : null;
        summaryRow[`${sf.fieldName}_${compareType}增量`] = null;
      });
    });
    
    results.push(summaryRow);

    return results;
  }
};

// 导出到全局
window.VerticalStatistics = VerticalStatistics;
