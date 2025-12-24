// 统计计算引擎
class StatisticsEngine {
  constructor() {
    // 时间粒度层级定义
    this.granularityLevels = {
      '年度': 1,
      '季度': 2,
      '月度': 3,
      '旬度': 4,
      '周度': 3.5,  // 周与月平级，但属于不同体系
      '日度': 5,
      '时': 6,
      '分': 7,
      '秒': 8
    };

    // 月体系粒度
    this.monthSystemGranularities = ['年度', '季度', '月度', '旬度'];
    // 周体系粒度
    this.weekSystemGranularities = ['年度', '周度'];
    // 日及以下粒度（两个体系共用）
    this.dayAndBelowGranularities = ['日度', '时', '分', '秒'];
  }

  // ========== 聚合函数 ==========

  /**
   * 求和
   */
  sum(values) {
    return values.reduce((acc, val) => acc + (Number(val) || 0), 0);
  }

  /**
   * 平均值
   */
  avg(values) {
    if (values.length === 0) return 0;
    return this.sum(values) / values.length;
  }

  /**
   * 计数
   */
  count(values) {
    return values.length;
  }

  /**
   * 最大值
   */
  max(values) {
    if (values.length === 0) return null;
    return Math.max(...values.map(v => Number(v) || 0));
  }

  /**
   * 最小值
   */
  min(values) {
    if (values.length === 0) return null;
    return Math.min(...values.map(v => Number(v) || 0));
  }

  /**
   * 执行聚合
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
  }

  // ========== 时间处理 ==========

  /**
   * 从日期获取时间粒度值
   * @param {Date|string} date - 日期
   * @param {string} granularity - 粒度
   * @returns {string} 粒度值（如 "2025-01", "2025-Q1" 等）
   */
  getGranularityValue(date, granularity) {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;

    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = d.getHours();
    const minute = d.getMinutes();
    const second = d.getSeconds();

    switch (granularity) {
      case '年度':
        return `${year}`;
      
      case '季度':
        const quarter = Math.ceil(month / 3);
        return `${year}-Q${quarter}`;
      
      case '月度':
        return `${year}-${String(month).padStart(2, '0')}`;
      
      case '旬度':
        let xun;
        if (day <= 10) xun = '上旬';
        else if (day <= 20) xun = '中旬';
        else xun = '下旬';
        return `${year}-${String(month).padStart(2, '0')}-${xun}`;
      
      case '周度':
        const weekNum = this.getWeekOfYear(d);
        return `${year}-W${String(weekNum).padStart(2, '0')}`;
      
      case '日度':
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      case '时':
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:00`;
      
      case '分':
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      
      case '秒':
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
      
      default:
        return `${year}-${String(month).padStart(2, '0')}`;
    }
  }

  /**
   * 获取一年中的第几周
   */
  getWeekOfYear(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  }

  /**
   * 获取环比期（上一期）
   * @param {string} periodValue - 当前期值
   * @param {string} granularity - 粒度
   * @returns {string} 上一期值
   */
  getPreviousPeriod(periodValue, granularity) {
    switch (granularity) {
      case '年度': {
        const year = parseInt(periodValue);
        return `${year - 1}`;
      }
      
      case '季度': {
        const [year, q] = periodValue.split('-Q');
        const quarter = parseInt(q);
        if (quarter === 1) {
          return `${parseInt(year) - 1}-Q4`;
        }
        return `${year}-Q${quarter - 1}`;
      }
      
      case '月度': {
        const [year, month] = periodValue.split('-').map(Number);
        if (month === 1) {
          return `${year - 1}-12`;
        }
        return `${year}-${String(month - 1).padStart(2, '0')}`;
      }
      
      case '旬度': {
        const match = periodValue.match(/(\d{4})-(\d{2})-(上旬|中旬|下旬)/);
        if (!match) return null;
        const [, year, month, xun] = match;
        const y = parseInt(year);
        const m = parseInt(month);
        
        if (xun === '上旬') {
          // 上旬 -> 上月下旬
          if (m === 1) {
            return `${y - 1}-12-下旬`;
          }
          return `${y}-${String(m - 1).padStart(2, '0')}-下旬`;
        } else if (xun === '中旬') {
          return `${year}-${month}-上旬`;
        } else {
          return `${year}-${month}-中旬`;
        }
      }
      
      case '周度': {
        const match = periodValue.match(/(\d{4})-W(\d{2})/);
        if (!match) return null;
        const [, year, week] = match;
        const y = parseInt(year);
        const w = parseInt(week);
        
        if (w === 1) {
          // 第1周 -> 上一年最后一周（约52或53）
          return `${y - 1}-W52`;
        }
        return `${y}-W${String(w - 1).padStart(2, '0')}`;
      }
      
      case '日度': {
        const d = new Date(periodValue);
        d.setDate(d.getDate() - 1);
        return this.getGranularityValue(d, '日度');
      }
      
      case '时': {
        const d = new Date(periodValue.replace(' ', 'T') + ':00');
        d.setHours(d.getHours() - 1);
        return this.getGranularityValue(d, '时');
      }
      
      case '分': {
        const d = new Date(periodValue.replace(' ', 'T') + ':00');
        d.setMinutes(d.getMinutes() - 1);
        return this.getGranularityValue(d, '分');
      }
      
      case '秒': {
        const d = new Date(periodValue.replace(' ', 'T'));
        d.setSeconds(d.getSeconds() - 1);
        return this.getGranularityValue(d, '秒');
      }
      
      default:
        return null;
    }
  }

  /**
   * 获取同比期（上一个更大周期的同位置）
   * @param {string} periodValue - 当前期值
   * @param {string} granularity - 当前粒度
   * @param {string} compareType - 同比类型（年同比、季同比、月同比等）
   * @returns {string} 同比期值
   */
  getComparePeriod(periodValue, granularity, compareType) {
    // 解析同比类型
    const compareGranularity = compareType.replace('同比', '');
    
    switch (compareType) {
      case '年同比':
        return this.getYearOverYearPeriod(periodValue, granularity);
      case '季同比':
        return this.getQuarterOverQuarterPeriod(periodValue, granularity);
      case '月同比':
        return this.getMonthOverMonthPeriod(periodValue, granularity);
      case '旬同比':
        return this.getXunOverXunPeriod(periodValue, granularity);
      case '周同比':
        return this.getWeekOverWeekPeriod(periodValue, granularity);
      case '日同比':
        return this.getDayOverDayPeriod(periodValue, granularity);
      case '时同比':
        return this.getHourOverHourPeriod(periodValue, granularity);
      case '分同比':
        return this.getMinuteOverMinutePeriod(periodValue, granularity);
      default:
        return null;
    }
  }

  /**
   * 年同比：去年同期
   */
  getYearOverYearPeriod(periodValue, granularity) {
    switch (granularity) {
      case '季度': {
        const [year, q] = periodValue.split('-Q');
        return `${parseInt(year) - 1}-Q${q}`;
      }
      case '月度': {
        const [year, month] = periodValue.split('-');
        return `${parseInt(year) - 1}-${month}`;
      }
      case '旬度': {
        const match = periodValue.match(/(\d{4})-(\d{2})-(上旬|中旬|下旬)/);
        if (!match) return null;
        const [, year, month, xun] = match;
        return `${parseInt(year) - 1}-${month}-${xun}`;
      }
      case '周度': {
        const match = periodValue.match(/(\d{4})-W(\d{2})/);
        if (!match) return null;
        const [, year, week] = match;
        return `${parseInt(year) - 1}-W${week}`;
      }
      case '日度': {
        const d = new Date(periodValue);
        d.setFullYear(d.getFullYear() - 1);
        return this.getGranularityValue(d, '日度');
      }
      case '时': {
        const d = new Date(periodValue.replace(' ', 'T') + ':00');
        d.setFullYear(d.getFullYear() - 1);
        return this.getGranularityValue(d, '时');
      }
      case '分': {
        const d = new Date(periodValue.replace(' ', 'T') + ':00');
        d.setFullYear(d.getFullYear() - 1);
        return this.getGranularityValue(d, '分');
      }
      case '秒': {
        const d = new Date(periodValue.replace(' ', 'T'));
        d.setFullYear(d.getFullYear() - 1);
        return this.getGranularityValue(d, '秒');
      }
      default:
        return null;
    }
  }

  /**
   * 季同比：上季度同期
   */
  getQuarterOverQuarterPeriod(periodValue, granularity) {
    switch (granularity) {
      case '月度': {
        const [year, month] = periodValue.split('-').map(Number);
        let newMonth = month - 3;
        let newYear = year;
        if (newMonth <= 0) {
          newMonth += 12;
          newYear -= 1;
        }
        return `${newYear}-${String(newMonth).padStart(2, '0')}`;
      }
      case '旬度': {
        const match = periodValue.match(/(\d{4})-(\d{2})-(上旬|中旬|下旬)/);
        if (!match) return null;
        let [, year, month, xun] = match;
        let y = parseInt(year);
        let m = parseInt(month) - 3;
        if (m <= 0) {
          m += 12;
          y -= 1;
        }
        return `${y}-${String(m).padStart(2, '0')}-${xun}`;
      }
      default:
        return null;
    }
  }

  /**
   * 月同比：上月同期
   */
  getMonthOverMonthPeriod(periodValue, granularity) {
    switch (granularity) {
      case '旬度': {
        const match = periodValue.match(/(\d{4})-(\d{2})-(上旬|中旬|下旬)/);
        if (!match) return null;
        let [, year, month, xun] = match;
        let y = parseInt(year);
        let m = parseInt(month) - 1;
        if (m <= 0) {
          m = 12;
          y -= 1;
        }
        return `${y}-${String(m).padStart(2, '0')}-${xun}`;
      }
      case '周度': {
        // 周度的月同比：上月同一周（约4周前）
        const match = periodValue.match(/(\d{4})-W(\d{2})/);
        if (!match) return null;
        const [, year, week] = match;
        let y = parseInt(year);
        let w = parseInt(week) - 4;
        if (w <= 0) {
          w += 52;
          y -= 1;
        }
        return `${y}-W${String(w).padStart(2, '0')}`;
      }
      case '日度': {
        const d = new Date(periodValue);
        d.setMonth(d.getMonth() - 1);
        return this.getGranularityValue(d, '日度');
      }
      case '时': {
        const d = new Date(periodValue.replace(' ', 'T') + ':00');
        d.setMonth(d.getMonth() - 1);
        return this.getGranularityValue(d, '时');
      }
      case '分': {
        const d = new Date(periodValue.replace(' ', 'T') + ':00');
        d.setMonth(d.getMonth() - 1);
        return this.getGranularityValue(d, '分');
      }
      case '秒': {
        const d = new Date(periodValue.replace(' ', 'T'));
        d.setMonth(d.getMonth() - 1);
        return this.getGranularityValue(d, '秒');
      }
      default:
        return null;
    }
  }

  /**
   * 旬同比：上旬同期
   */
  getXunOverXunPeriod(periodValue, granularity) {
    if (granularity !== '日度') return null;
    
    const d = new Date(periodValue);
    const day = d.getDate();
    
    // 上旬同期：日期减10天
    d.setDate(day - 10);
    return this.getGranularityValue(d, '日度');
  }

  /**
   * 周同比：上周同期
   */
  getWeekOverWeekPeriod(periodValue, granularity) {
    switch (granularity) {
      case '日度': {
        const d = new Date(periodValue);
        d.setDate(d.getDate() - 7);
        return this.getGranularityValue(d, '日度');
      }
      case '时': {
        const d = new Date(periodValue.replace(' ', 'T') + ':00');
        d.setDate(d.getDate() - 7);
        return this.getGranularityValue(d, '时');
      }
      default:
        return null;
    }
  }

  /**
   * 日同比：昨日同期
   */
  getDayOverDayPeriod(periodValue, granularity) {
    switch (granularity) {
      case '时': {
        const d = new Date(periodValue.replace(' ', 'T') + ':00');
        d.setDate(d.getDate() - 1);
        return this.getGranularityValue(d, '时');
      }
      case '分': {
        const d = new Date(periodValue.replace(' ', 'T') + ':00');
        d.setDate(d.getDate() - 1);
        return this.getGranularityValue(d, '分');
      }
      case '秒': {
        const d = new Date(periodValue.replace(' ', 'T'));
        d.setDate(d.getDate() - 1);
        return this.getGranularityValue(d, '秒');
      }
      default:
        return null;
    }
  }

  /**
   * 时同比：上小时同期
   */
  getHourOverHourPeriod(periodValue, granularity) {
    switch (granularity) {
      case '分': {
        const d = new Date(periodValue.replace(' ', 'T') + ':00');
        d.setHours(d.getHours() - 1);
        return this.getGranularityValue(d, '分');
      }
      case '秒': {
        const d = new Date(periodValue.replace(' ', 'T'));
        d.setHours(d.getHours() - 1);
        return this.getGranularityValue(d, '秒');
      }
      default:
        return null;
    }
  }

  /**
   * 分同比：上分钟同期
   */
  getMinuteOverMinutePeriod(periodValue, granularity) {
    if (granularity !== '秒') return null;
    
    const d = new Date(periodValue.replace(' ', 'T'));
    d.setMinutes(d.getMinutes() - 1);
    return this.getGranularityValue(d, '秒');
  }

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

  // ========== 纵向统计（时间维度） ==========

  /**
   * 获取期间的友好显示名称
   * @param {string} periodValue - 期间值
   * @param {string} granularity - 粒度
   * @returns {string} 友好显示名称
   */
  getPeriodDisplayName(periodValue, granularity) {
    switch (granularity) {
      case '年度':
        return `${periodValue}年`;
      case '季度': {
        const [year, q] = periodValue.split('-Q');
        const quarterNames = { '1': '一', '2': '二', '3': '三', '4': '四' };
        return `${year}年第${quarterNames[q] || q}季度`;
      }
      case '月度': {
        const [year, month] = periodValue.split('-');
        return `${year}年${parseInt(month)}月`;
      }
      case '旬度': {
        const match = periodValue.match(/(\d{4})-(\d{2})-(上旬|中旬|下旬)/);
        if (match) {
          return `${match[1]}年${parseInt(match[2])}月${match[3]}`;
        }
        return periodValue;
      }
      case '周度': {
        const match = periodValue.match(/(\d{4})-W(\d{2})/);
        if (match) {
          return `${match[1]}年第${parseInt(match[2])}周`;
        }
        return periodValue;
      }
      case '日度': {
        const [year, month, day] = periodValue.split('-');
        return `${year}年${parseInt(month)}月${parseInt(day)}日`;
      }
      case '时':
        return periodValue.replace(' ', ' ') + '时';
      case '分':
        return periodValue;
      case '秒':
        return periodValue;
      default:
        return periodValue;
    }
  }

  /**
   * 获取当前期间值（用于判断数据完整性）
   * @param {string} granularity - 粒度
   * @returns {string} 当前期间值
   */
  getCurrentPeriod(granularity) {
    return this.getGranularityValue(new Date(), granularity);
  }

  /**
   * 判断期间是否完整（是否已过去）
   * @param {string} periodValue - 期间值
   * @param {string} granularity - 粒度
   * @returns {boolean} 是否完整
   */
  isPeriodComplete(periodValue, granularity) {
    const currentPeriod = this.getCurrentPeriod(granularity);
    return periodValue < currentPeriod;
  }

  /**
   * 执行纵向统计
   * @param {Array} data - 数据
   * @param {Object} config - 统计配置
   * @returns {Array} 统计结果
   */
  executeVerticalStatistics(data, config) {
    const {
      timeFieldId,
      timeGranularity,
      statisticFields,
      aggregation,
      valueTypes,
      compareTypes
    } = config;

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
      
      const periodKey = this.getGranularityValue(timeValue, timeGranularity);
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
        periodStats[period][sf.fieldId] = this.aggregate(values, aggregation);
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
        periodName: this.getPeriodDisplayName(period, timeGranularity),
        isComplete: this.isPeriodComplete(period, timeGranularity)
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
          const prevPeriod = this.getPreviousPeriod(period, timeGranularity);
          const prevValue = prevPeriod && periodStats[prevPeriod] ? periodStats[prevPeriod][sf.fieldId] : null;
          
          if (prevValue !== null && prevValue !== 0) {
            row[`${sf.fieldName}_环比`] = (currentValue - prevValue) / Math.abs(prevValue);
          } else if (prevValue === 0 && currentValue !== 0) {
            row[`${sf.fieldName}_环比`] = currentValue > 0 ? 1 : -1; // 从0增长，标记为100%或-100%
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
          const comparePeriod = this.getComparePeriod(period, timeGranularity, compareType);
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
        summaryRow[`${sf.fieldName}_环比增量`] = null; // 增量汇总无意义
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

  // ========== 横向统计（分组维度） ==========

  /**
   * 执行横向统计
   * @param {Array} data - 数据
   * @param {Object} config - 统计配置
   * @returns {Array} 统计结果
   */
  executeHorizontalStatistics(data, config) {
    const {
      purpose,
      groupFields,
      statisticFields,
      aggregation,
      // 新增配置项
      sortBy,           // 排序字段ID
      sortOrder,        // 排序方向: 'asc' | 'desc'
      topN,             // 只显示前N个
      showSubtotal,     // 是否显示小计（多级分组时）
      crossTableField   // 交叉表列字段ID
    } = config;

    // 如果配置了交叉表字段，执行交叉表统计
    if (crossTableField) {
      return this.executeCrossTableStatistics(data, config);
    }

    // 按分组字段分组
    const groups = {};
    data.forEach(record => {
      const groupKey = groupFields.map(gf => record[gf.fieldId] ?? '(空)').join('|');
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          groupValues: groupFields.map(gf => ({
            fieldId: gf.fieldId,
            fieldName: gf.fieldName,
            value: record[gf.fieldId] ?? '(空)'
          })),
          records: []
        };
      }
      groups[groupKey].records.push(record);
    });

    // 计算每个分组的统计值
    const rawResults = [];
    let totals = {};
    let totalCount = 0;
    statisticFields.forEach(sf => {
      totals[sf.fieldId] = 0;
    });

    Object.keys(groups).forEach(groupKey => {
      const group = groups[groupKey];
      const row = {
        _groupKey: groupKey,
        _recordCount: group.records.length
      };
      
      // 添加分组字段值
      group.groupValues.forEach(gv => {
        row[gv.fieldName] = gv.value;
        row[`_${gv.fieldId}`] = gv.value; // 内部字段ID引用
      });
      
      // 计算统计值
      statisticFields.forEach(sf => {
        const values = group.records
          .map(r => r[sf.fieldId])
          .filter(v => v !== null && v !== undefined && !isNaN(Number(v)))
          .map(v => Number(v));
        const aggValue = this.aggregate(values, aggregation);
        row[sf.fieldName] = aggValue;
        row[`_${sf.fieldId}`] = aggValue; // 内部字段ID引用
        totals[sf.fieldId] += aggValue;
      });
      
      totalCount += group.records.length;
      rawResults.push(row);
    });

    // 排序
    let sortedResults = [...rawResults];
    if (sortBy) {
      const sortField = statisticFields.find(sf => sf.fieldId === sortBy);
      if (sortField) {
        sortedResults.sort((a, b) => {
          const aVal = a[sortField.fieldName] || 0;
          const bVal = b[sortField.fieldName] || 0;
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });
      }
    } else {
      // 默认按第一个统计字段降序
      if (statisticFields.length > 0) {
        const firstField = statisticFields[0];
        sortedResults.sort((a, b) => {
          const aVal = a[firstField.fieldName] || 0;
          const bVal = b[firstField.fieldName] || 0;
          return bVal - aVal;
        });
      }
    }

    // Top N 筛选
    let filteredResults = sortedResults;
    let othersRow = null;
    if (topN && topN > 0 && sortedResults.length > topN) {
      filteredResults = sortedResults.slice(0, topN);
      
      // 计算"其他"行
      const othersData = sortedResults.slice(topN);
      othersRow = {
        _groupKey: '_OTHERS',
        _recordCount: othersData.reduce((sum, r) => sum + r._recordCount, 0),
        _isOthers: true
      };
      
      groupFields.forEach(gf => {
        othersRow[gf.fieldName] = `其他 (${othersData.length}项)`;
      });
      
      statisticFields.forEach(sf => {
        othersRow[sf.fieldName] = othersData.reduce((sum, r) => sum + (r[sf.fieldName] || 0), 0);
      });
    }

    // 构建最终结果
    let results = [];
    let cumulativeRatio = {};
    statisticFields.forEach(sf => {
      cumulativeRatio[sf.fieldId] = 0;
    });

    // 添加排名和占比
    filteredResults.forEach((row, index) => {
      const newRow = { 
        ...row,
        _rank: index + 1,
        记录数: row._recordCount
      };
      
      // 计算占比和累计占比
      if (purpose === '占比分析') {
        statisticFields.forEach(sf => {
          const value = row[sf.fieldName] || 0;
          const total = totals[sf.fieldId] || 1;
          const ratio = value / total;
          newRow[`${sf.fieldName}_占比`] = ratio;
          
          cumulativeRatio[sf.fieldId] += ratio;
          newRow[`${sf.fieldName}_累计占比`] = cumulativeRatio[sf.fieldId];
        });
      }
      
      results.push(newRow);
    });

    // 添加"其他"行
    if (othersRow) {
      if (purpose === '占比分析') {
        statisticFields.forEach(sf => {
          const value = othersRow[sf.fieldName] || 0;
          const total = totals[sf.fieldId] || 1;
          othersRow[`${sf.fieldName}_占比`] = value / total;
          othersRow[`${sf.fieldName}_累计占比`] = 1;
        });
      }
      othersRow.记录数 = othersRow._recordCount;
      results.push(othersRow);
    }

    // 多级分组时添加小计行
    if (showSubtotal && groupFields.length > 1) {
      results = this.addSubtotalRows(results, groupFields, statisticFields, purpose, totals);
    }

    // 添加合计行
    const totalRow = {
      _groupKey: '_TOTAL',
      _isTotal: true,
      记录数: totalCount
    };
    groupFields.forEach((gf, index) => {
      totalRow[gf.fieldName] = index === 0 ? '合计' : '';
    });
    statisticFields.forEach(sf => {
      totalRow[sf.fieldName] = totals[sf.fieldId];
      if (purpose === '占比分析') {
        totalRow[`${sf.fieldName}_占比`] = 1;
        totalRow[`${sf.fieldName}_累计占比`] = 1;
      }
    });
    results.push(totalRow);

    return results;
  }

  /**
   * 添加小计行（多级分组）
   */
  addSubtotalRows(results, groupFields, statisticFields, purpose, totals) {
    if (groupFields.length < 2) return results;
    
    const newResults = [];
    const firstField = groupFields[0];
    let currentFirstValue = null;
    let subtotalData = [];
    
    results.forEach((row, index) => {
      if (row._isTotal || row._isOthers) {
        // 先添加上一组的小计
        if (subtotalData.length > 0 && currentFirstValue !== null) {
          newResults.push(this.createSubtotalRow(
            subtotalData, firstField, groupFields, statisticFields, purpose, totals, currentFirstValue
          ));
        }
        newResults.push(row);
        return;
      }
      
      const firstValue = row[firstField.fieldName];
      
      if (currentFirstValue !== null && firstValue !== currentFirstValue) {
        // 添加小计行
        newResults.push(this.createSubtotalRow(
          subtotalData, firstField, groupFields, statisticFields, purpose, totals, currentFirstValue
        ));
        subtotalData = [];
      }
      
      currentFirstValue = firstValue;
      subtotalData.push(row);
      newResults.push(row);
    });
    
    return newResults;
  }

  /**
   * 创建小计行
   */
  createSubtotalRow(dataRows, firstField, groupFields, statisticFields, purpose, totals, groupValue) {
    const subtotalRow = {
      _groupKey: `_SUBTOTAL_${groupValue}`,
      _isSubtotal: true,
      记录数: dataRows.reduce((sum, r) => sum + (r.记录数 || r._recordCount || 0), 0)
    };
    
    groupFields.forEach((gf, index) => {
      if (index === 0) {
        subtotalRow[gf.fieldName] = `${groupValue} 小计`;
      } else {
        subtotalRow[gf.fieldName] = '';
      }
    });
    
    statisticFields.forEach(sf => {
      const subtotal = dataRows.reduce((sum, r) => sum + (r[sf.fieldName] || 0), 0);
      subtotalRow[sf.fieldName] = subtotal;
      
      if (purpose === '占比分析') {
        const total = totals[sf.fieldId] || 1;
        subtotalRow[`${sf.fieldName}_占比`] = subtotal / total;
      }
    });
    
    return subtotalRow;
  }

  /**
   * 执行交叉表统计（透视表）
   */
  executeCrossTableStatistics(data, config) {
    const {
      purpose,
      groupFields,
      statisticFields,
      aggregation,
      crossTableField
    } = config;

    // 找到交叉表列字段
    const colField = groupFields.find(gf => gf.fieldId === crossTableField);
    const rowFields = groupFields.filter(gf => gf.fieldId !== crossTableField);
    
    if (!colField || rowFields.length === 0) {
      // 回退到普通横向统计
      return this.executeHorizontalStatistics(data, { ...config, crossTableField: null });
    }

    // 获取所有列值
    const colValues = [...new Set(data.map(r => r[colField.fieldId] ?? '(空)'))].sort();
    
    // 按行字段分组
    const rowGroups = {};
    data.forEach(record => {
      const rowKey = rowFields.map(rf => record[rf.fieldId] ?? '(空)').join('|');
      const colValue = record[colField.fieldId] ?? '(空)';
      
      if (!rowGroups[rowKey]) {
        rowGroups[rowKey] = {
          rowValues: rowFields.map(rf => ({
            fieldId: rf.fieldId,
            fieldName: rf.fieldName,
            value: record[rf.fieldId] ?? '(空)'
          })),
          columns: {}
        };
      }
      
      if (!rowGroups[rowKey].columns[colValue]) {
        rowGroups[rowKey].columns[colValue] = [];
      }
      rowGroups[rowKey].columns[colValue].push(record);
    });

    // 计算统计值
    const results = [];
    const colTotals = {};
    colValues.forEach(cv => {
      colTotals[cv] = {};
      statisticFields.forEach(sf => {
        colTotals[cv][sf.fieldId] = 0;
      });
    });
    const rowTotals = {};
    let grandTotal = {};
    statisticFields.forEach(sf => {
      grandTotal[sf.fieldId] = 0;
    });

    Object.keys(rowGroups).sort().forEach(rowKey => {
      const group = rowGroups[rowKey];
      const row = {
        _rowKey: rowKey
      };
      
      // 添加行字段值
      group.rowValues.forEach(rv => {
        row[rv.fieldName] = rv.value;
      });
      
      // 初始化行合计
      rowTotals[rowKey] = {};
      statisticFields.forEach(sf => {
        rowTotals[rowKey][sf.fieldId] = 0;
      });
      
      // 计算每列的统计值
      statisticFields.forEach(sf => {
        colValues.forEach(cv => {
          const records = group.columns[cv] || [];
          const values = records
            .map(r => r[sf.fieldId])
            .filter(v => v !== null && v !== undefined && !isNaN(Number(v)))
            .map(v => Number(v));
          const aggValue = this.aggregate(values, aggregation);
          
          // 列名格式：字段名_列值（如果只有一个统计字段，省略字段名）
          const colName = statisticFields.length === 1 
            ? cv 
            : `${sf.fieldName}_${cv}`;
          row[colName] = aggValue;
          
          // 累加到列合计
          colTotals[cv][sf.fieldId] += aggValue;
          // 累加到行合计
          rowTotals[rowKey][sf.fieldId] += aggValue;
          // 累加到总计
          grandTotal[sf.fieldId] += aggValue;
        });
        
        // 添加行合计列
        const rowTotalColName = statisticFields.length === 1 
          ? '行合计' 
          : `${sf.fieldName}_行合计`;
        row[rowTotalColName] = rowTotals[rowKey][sf.fieldId];
      });
      
      results.push(row);
    });

    // 添加列合计行
    const totalRow = {
      _rowKey: '_TOTAL',
      _isTotal: true
    };
    rowFields.forEach((rf, index) => {
      totalRow[rf.fieldName] = index === 0 ? '列合计' : '';
    });
    
    statisticFields.forEach(sf => {
      colValues.forEach(cv => {
        const colName = statisticFields.length === 1 ? cv : `${sf.fieldName}_${cv}`;
        totalRow[colName] = colTotals[cv][sf.fieldId];
      });
      
      const rowTotalColName = statisticFields.length === 1 ? '行合计' : `${sf.fieldName}_行合计`;
      totalRow[rowTotalColName] = grandTotal[sf.fieldId];
    });
    
    results.push(totalRow);

    // 如果是占比分析，计算占比
    if (purpose === '占比分析') {
      results.forEach(row => {
        if (row._isTotal) return;
        
        statisticFields.forEach(sf => {
          colValues.forEach(cv => {
            const colName = statisticFields.length === 1 ? cv : `${sf.fieldName}_${cv}`;
            const value = row[colName] || 0;
            const total = grandTotal[sf.fieldId] || 1;
            row[`${colName}_占比`] = value / total;
          });
        });
      });
    }

    return results;
  }

  // ========== 完整统计流程 ==========

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

// 导出
window.StatisticsEngine = new StatisticsEngine();
