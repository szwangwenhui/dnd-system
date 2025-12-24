/**
 * 统计模块 - 时间处理工具
 * 提供时间粒度转换、周期计算、同比环比等功能
 */

const TimeUtils = {
  // 时间粒度层级定义
  granularityLevels: {
    '年度': 1,
    '季度': 2,
    '月度': 3,
    '旬度': 4,
    '周度': 3.5,
    '日度': 5,
    '时': 6,
    '分': 7,
    '秒': 8
  },

  // 月体系粒度
  monthSystemGranularities: ['年度', '季度', '月度', '旬度'],
  // 周体系粒度
  weekSystemGranularities: ['年度', '周度'],
  // 日及以下粒度（两个体系共用）
  dayAndBelowGranularities: ['日度', '时', '分', '秒'],

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
  },

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
  },

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
  },

  /**
   * 获取同比期（上一个更大周期的同位置）
   * @param {string} periodValue - 当前期值
   * @param {string} granularity - 当前粒度
   * @param {string} compareType - 同比类型
   * @returns {string} 同比期值
   */
  getComparePeriod(periodValue, granularity, compareType) {
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
  },

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
  },

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
  },

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
  },

  /**
   * 旬同比：上旬同期
   */
  getXunOverXunPeriod(periodValue, granularity) {
    if (granularity !== '日度') return null;
    
    const d = new Date(periodValue);
    const day = d.getDate();
    d.setDate(day - 10);
    return this.getGranularityValue(d, '日度');
  },

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
  },

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
  },

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
  },

  /**
   * 分同比：上分钟同期
   */
  getMinuteOverMinutePeriod(periodValue, granularity) {
    if (granularity !== '秒') return null;
    
    const d = new Date(periodValue.replace(' ', 'T'));
    d.setMinutes(d.getMinutes() - 1);
    return this.getGranularityValue(d, '秒');
  },

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
  },

  /**
   * 获取当前期间值
   * @param {string} granularity - 粒度
   * @returns {string} 当前期间值
   */
  getCurrentPeriod(granularity) {
    return this.getGranularityValue(new Date(), granularity);
  },

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
};

// 导出到全局
window.StatisticsTimeUtils = TimeUtils;
