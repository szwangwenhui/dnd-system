/**
 * DND原语表达式引擎
 * 负责：Token序列验证、转换为可执行表达式、执行计算
 */

class PrimitiveEngine {
  constructor() {
    // 注册安全的数学函数
    this.safeFunctions = {
      round: (value, decimals = 0) => {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
      },
      abs: Math.abs,
      sqrt: Math.sqrt,
      floor: Math.floor,
      ceil: Math.ceil,
      max: Math.max,
      min: Math.min
    };
    
    // 注册聚合函数
    this.aggregationFunctions = {
      // 求和
      sum: (arr) => {
        if (!Array.isArray(arr)) return 0;
        return arr.reduce((acc, val) => acc + (Number(val) || 0), 0);
      },
      
      // 平均值
      avg: (arr) => {
        if (!Array.isArray(arr) || arr.length === 0) return 0;
        const sum = arr.reduce((acc, val) => acc + (Number(val) || 0), 0);
        return sum / arr.length;
      },
      
      // 计数
      count: (arr) => {
        if (!Array.isArray(arr)) return 0;
        return arr.length;
      },
      
      // 最大值（返回键值对）
      max: (arr, keys = null) => {
        if (!Array.isArray(arr) || arr.length === 0) return { key: null, value: null };
        let maxVal = -Infinity;
        let maxIdx = 0;
        arr.forEach((val, idx) => {
          const num = Number(val) || 0;
          if (num > maxVal) {
            maxVal = num;
            maxIdx = idx;
          }
        });
        const key = keys && keys[maxIdx] !== undefined ? keys[maxIdx] : maxIdx;
        return { key: key, value: maxVal };
      },
      
      // 最小值（返回键值对）
      min: (arr, keys = null) => {
        if (!Array.isArray(arr) || arr.length === 0) return { key: null, value: null };
        let minVal = Infinity;
        let minIdx = 0;
        arr.forEach((val, idx) => {
          const num = Number(val) || 0;
          if (num < minVal) {
            minVal = num;
            minIdx = idx;
          }
        });
        const key = keys && keys[minIdx] !== undefined ? keys[minIdx] : minIdx;
        return { key: key, value: minVal };
      }
    };

    // 注册字符串函数（20个）
    this.stringFunctions = {
      // 1. 获取长度
      length: (source) => {
        if (source == null) return 0;
        return String(source).length;
      },

      // 2. 字符串拼接
      concat: (...args) => {
        return args.map(a => a == null ? '' : String(a)).join('');
      },

      // 3. 按位置截取
      substring: (source, start, end) => {
        if (source == null) return '';
        const str = String(source);
        if (end === null || end === undefined) {
          return str.substring(start);
        }
        return str.substring(start, end);
      },

      // 4. 左截取
      left: (source, length) => {
        if (source == null) return '';
        return String(source).substring(0, length);
      },

      // 5. 右截取
      right: (source, length) => {
        if (source == null) return '';
        const str = String(source);
        return str.substring(Math.max(0, str.length - length));
      },

      // 6. 截取子串（移除子串）
      remove: (source, target, ignoreCase = false, removeAll = true) => {
        if (source == null || target == null) return source == null ? '' : String(source);
        let str = String(source);
        const tgt = String(target);
        if (ignoreCase) {
          if (removeAll) {
            const regex = new RegExp(tgt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            return str.replace(regex, '');
          } else {
            const idx = str.toLowerCase().indexOf(tgt.toLowerCase());
            if (idx === -1) return str;
            return str.substring(0, idx) + str.substring(idx + tgt.length);
          }
        } else {
          if (removeAll) {
            return str.split(tgt).join('');
          } else {
            const idx = str.indexOf(tgt);
            if (idx === -1) return str;
            return str.substring(0, idx) + str.substring(idx + tgt.length);
          }
        }
      },

      // 7. 替换
      replace: (source, find, replacement, replaceAll = true) => {
        if (source == null) return '';
        const str = String(source);
        if (replaceAll) {
          return str.split(find).join(replacement);
        } else {
          return str.replace(find, replacement);
        }
      },

      // 8. 查找位置
      indexOf: (source, search, startIndex = 0) => {
        if (source == null) return -1;
        return String(source).indexOf(search, startIndex);
      },

      // 9. 转大写
      toUpperCase: (source) => {
        if (source == null) return '';
        return String(source).toUpperCase();
      },

      // 10. 转小写
      toLowerCase: (source) => {
        if (source == null) return '';
        return String(source).toLowerCase();
      },

      // 11. 去空格
      trim: (source, mode = '两端') => {
        if (source == null) return '';
        const str = String(source);
        switch (mode) {
          case '仅左侧': return str.trimStart();
          case '仅右侧': return str.trimEnd();
          default: return str.trim();
        }
      },

      // 12. 分割
      split: (source, separator, limit) => {
        if (source == null) return [];
        if (limit !== undefined && limit !== null) {
          return String(source).split(separator, limit);
        }
        return String(source).split(separator);
      },

      // 13. 判断包含
      contains: (source, search, ignoreCase = false) => {
        if (source == null) return false;
        const str = String(source);
        const srch = String(search);
        if (ignoreCase) {
          return str.toLowerCase().includes(srch.toLowerCase());
        }
        return str.includes(srch);
      },

      // 14. 判断开头
      startsWith: (source, prefix, ignoreCase = false) => {
        if (source == null) return false;
        const str = String(source);
        const pfx = String(prefix);
        if (ignoreCase) {
          return str.toLowerCase().startsWith(pfx.toLowerCase());
        }
        return str.startsWith(pfx);
      },

      // 15. 判断结尾
      endsWith: (source, suffix, ignoreCase = false) => {
        if (source == null) return false;
        const str = String(source);
        const sfx = String(suffix);
        if (ignoreCase) {
          return str.toLowerCase().endsWith(sfx.toLowerCase());
        }
        return str.endsWith(sfx);
      },

      // 16. 判空
      isEmpty: (source, mode = '严格空') => {
        if (source === null || source === undefined) {
          return mode === '包含null';
        }
        const str = String(source);
        switch (mode) {
          case '包含空白': return str.trim() === '';
          case '包含null': return str === '';
          default: return str === '';  // 严格空
        }
      },

      // 17. 左填充
      padStart: (source, length, padChar = ' ') => {
        if (source == null) return String('').padStart(length, padChar);
        return String(source).padStart(length, padChar);
      },

      // 18. 右填充
      padEnd: (source, length, padChar = ' ') => {
        if (source == null) return String('').padEnd(length, padChar);
        return String(source).padEnd(length, padChar);
      },

      // 19. 重复
      repeat: (source, count) => {
        if (source == null || count < 0) return '';
        return String(source).repeat(count);
      },

      // 20. 格式化
      format: (template, ...args) => {
        if (template == null) return '';
        let result = String(template);
        let argIndex = 0;
        // 替换{}占位符
        result = result.replace(/\{\}/g, () => {
          if (argIndex < args.length) {
            const val = args[argIndex++];
            return val == null ? '' : String(val);
          }
          return '{}';
        });
        return result;
      }
    };

    // 注册时间函数（15个）
    this.timeFunctions = {
      // 1. 获取当前时间
      now: (dateOnly = false) => {
        const now = new Date();
        return dateOnly ? this._formatDate(now, 'yyyy-MM-dd') : now;
      },

      // 2. 获取当前日期
      today: () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
      },

      // 3. 时间格式化
      format: (source, pattern = 'yyyy-MM-dd HH:mm:ss') => {
        const date = this._toDate(source);
        if (!date) return '';
        return this._formatDate(date, pattern);
      },

      // 4. 解析时间
      parse: (source, pattern = 'yyyy-MM-dd') => {
        return this._parseDate(source, pattern);
      },

      // 5. 时间加减
      add: (source, amount, unit = '天') => {
        const date = this._toDate(source);
        if (!date) return null;
        const result = new Date(date);
        
        switch (unit) {
          case '年': result.setFullYear(result.getFullYear() + amount); break;
          case '月': result.setMonth(result.getMonth() + amount); break;
          case '周': result.setDate(result.getDate() + amount * 7); break;
          case '天': result.setDate(result.getDate() + amount); break;
          case '时': result.setHours(result.getHours() + amount); break;
          case '分': result.setMinutes(result.getMinutes() + amount); break;
          case '秒': result.setSeconds(result.getSeconds() + amount); break;
        }
        return result;
      },

      // 6. 获取时间字段
      getField: (source, field, format = '数字') => {
        const date = this._toDate(source);
        if (!date) return null;
        
        const day = date.getDate();
        const weekday = date.getDay() === 0 ? 7 : date.getDay(); // 周日=7
        const weekdayNames = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        const xunNames = ['', '上旬', '中旬', '下旬'];
        
        switch (field) {
          case '年度': return date.getFullYear();
          case '季度': return Math.ceil((date.getMonth() + 1) / 3);
          case '月度': return date.getMonth() + 1;
          case '周度': return this._getWeekOfYear(date);
          case '旬度': 
            const xun = day <= 10 ? 1 : (day <= 20 ? 2 : 3);
            return format === '中文' ? xunNames[xun] : xun;
          case '月度日': return day;
          case '周度日': return format === '中文' ? weekdayNames[weekday] : weekday;
          case '小时': return date.getHours();
          case '分钟': return date.getMinutes();
          case '秒': return date.getSeconds();
          default: return null;
        }
      },

      // 7. 设置时间字段
      setField: (source, field, value) => {
        const date = this._toDate(source);
        if (!date) return null;
        const result = new Date(date);
        
        switch (field) {
          case '年度': result.setFullYear(value); break;
          case '月度': result.setMonth(value - 1); break;
          case '月度日': result.setDate(value); break;
          case '小时': result.setHours(value); break;
          case '分钟': result.setMinutes(value); break;
          case '秒': result.setSeconds(value); break;
        }
        return result;
      },

      // 8. 计算时间差
      diff: (start, end, unit = '天', round = '向下取整') => {
        const startDate = this._toDate(start);
        const endDate = this._toDate(end);
        if (!startDate || !endDate) return null;
        
        const diffMs = endDate.getTime() - startDate.getTime();
        let result;
        
        switch (unit) {
          case '秒': result = diffMs / 1000; break;
          case '分': result = diffMs / (1000 * 60); break;
          case '时': result = diffMs / (1000 * 60 * 60); break;
          case '天': result = diffMs / (1000 * 60 * 60 * 24); break;
          case '周': result = diffMs / (1000 * 60 * 60 * 24 * 7); break;
          case '月': result = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()); break;
          case '年': result = endDate.getFullYear() - startDate.getFullYear(); break;
          default: result = diffMs / (1000 * 60 * 60 * 24);
        }
        
        if (round === '向下取整') return Math.floor(result);
        if (round === '四舍五入') return Math.round(result);
        return result;
      },

      // 9. 是否在之前
      isBefore: (time1, time2) => {
        const date1 = this._toDate(time1);
        const date2 = this._toDate(time2);
        if (!date1 || !date2) return false;
        return date1.getTime() < date2.getTime();
      },

      // 10. 是否在之后
      isAfter: (time1, time2) => {
        const date1 = this._toDate(time1);
        const date2 = this._toDate(time2);
        if (!date1 || !date2) return false;
        return date1.getTime() > date2.getTime();
      },

      // 11. 转时间戳
      toTimestamp: (source, unit = '毫秒') => {
        const date = this._toDate(source);
        if (!date) return null;
        const ts = date.getTime();
        return unit === '秒' ? Math.floor(ts / 1000) : ts;
      },

      // 12. 时间戳转时间
      fromTimestamp: (timestamp, unit = '毫秒') => {
        const ts = Number(timestamp);
        if (isNaN(ts)) return null;
        return new Date(unit === '秒' ? ts * 1000 : ts);
      },

      // 13. 获取周期开始
      startOf: (source, period, weekStart = '周一') => {
        const date = this._toDate(source);
        if (!date) return null;
        const result = new Date(date);
        
        switch (period) {
          case '年':
            result.setMonth(0, 1);
            result.setHours(0, 0, 0, 0);
            break;
          case '季度':
            const quarter = Math.floor(result.getMonth() / 3);
            result.setMonth(quarter * 3, 1);
            result.setHours(0, 0, 0, 0);
            break;
          case '月':
            result.setDate(1);
            result.setHours(0, 0, 0, 0);
            break;
          case '周':
            const day = result.getDay();
            const diff = weekStart === '周一' 
              ? (day === 0 ? -6 : 1 - day)
              : -day;
            result.setDate(result.getDate() + diff);
            result.setHours(0, 0, 0, 0);
            break;
          case '天':
            result.setHours(0, 0, 0, 0);
            break;
          case '时':
            result.setMinutes(0, 0, 0);
            break;
        }
        return result;
      },

      // 14. 获取周期结束
      endOf: (source, period, weekStart = '周一') => {
        const date = this._toDate(source);
        if (!date) return null;
        const result = new Date(date);
        
        switch (period) {
          case '年':
            result.setMonth(11, 31);
            result.setHours(23, 59, 59, 999);
            break;
          case '季度':
            const quarter = Math.floor(result.getMonth() / 3);
            result.setMonth(quarter * 3 + 3, 0);
            result.setHours(23, 59, 59, 999);
            break;
          case '月':
            result.setMonth(result.getMonth() + 1, 0);
            result.setHours(23, 59, 59, 999);
            break;
          case '周':
            const day = result.getDay();
            const diff = weekStart === '周一'
              ? (day === 0 ? 0 : 7 - day)
              : 6 - day;
            result.setDate(result.getDate() + diff);
            result.setHours(23, 59, 59, 999);
            break;
          case '天':
            result.setHours(23, 59, 59, 999);
            break;
          case '时':
            result.setMinutes(59, 59, 999);
            break;
        }
        return result;
      },

      // 15. 判断有效时间
      isValid: (source, pattern) => {
        if (source == null || source === '') return false;
        const date = pattern ? this._parseDate(source, pattern) : this._toDate(source);
        return date !== null && !isNaN(date.getTime());
      }
    };
  }

  // ============ 时间辅助方法 ============
  
  // 转换为Date对象
  _toDate(value) {
    if (value == null) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'number') return new Date(value);
    if (typeof value === 'string') {
      // 尝试多种格式
      const date = new Date(value);
      if (!isNaN(date.getTime())) return date;
      // 尝试解析 yyyy-MM-dd 格式
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
      if (match) {
        return new Date(
          parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]),
          parseInt(match[4] || 0), parseInt(match[5] || 0), parseInt(match[6] || 0)
        );
      }
    }
    return null;
  }

  // 格式化日期
  _formatDate(date, pattern) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const weekday = date.getDay();
    const weekNames = ['日', '一', '二', '三', '四', '五', '六'];
    const quarter = Math.ceil(month / 3);

    return pattern
      .replace(/yyyy/g, year)
      .replace(/yy/g, String(year).slice(-2))
      .replace(/MM/g, String(month).padStart(2, '0'))
      .replace(/M/g, month)
      .replace(/dd/g, String(day).padStart(2, '0'))
      .replace(/d/g, day)
      .replace(/HH/g, String(hours).padStart(2, '0'))
      .replace(/H/g, hours)
      .replace(/mm/g, String(minutes).padStart(2, '0'))
      .replace(/m/g, minutes)
      .replace(/ss/g, String(seconds).padStart(2, '0'))
      .replace(/s/g, seconds)
      .replace(/E/g, '周' + weekNames[weekday])
      .replace(/Q/g, quarter);
  }

  // 解析日期字符串
  _parseDate(str, pattern) {
    if (!str || !pattern) return null;
    
    // 简化的解析逻辑
    let year = 1970, month = 1, day = 1, hours = 0, minutes = 0, seconds = 0;
    
    // 提取pattern中的位置
    const getPosition = (p, token) => {
      const idx = p.indexOf(token);
      return idx >= 0 ? { start: idx, length: token.length } : null;
    };

    const extract = (pos) => {
      if (!pos) return null;
      return str.substring(pos.start, pos.start + pos.length);
    };

    const yearPos = getPosition(pattern, 'yyyy');
    const monthPos = getPosition(pattern, 'MM');
    const dayPos = getPosition(pattern, 'dd');
    const hourPos = getPosition(pattern, 'HH');
    const minPos = getPosition(pattern, 'mm');
    const secPos = getPosition(pattern, 'ss');

    if (yearPos) year = parseInt(extract(yearPos)) || 1970;
    if (monthPos) month = parseInt(extract(monthPos)) || 1;
    if (dayPos) day = parseInt(extract(dayPos)) || 1;
    if (hourPos) hours = parseInt(extract(hourPos)) || 0;
    if (minPos) minutes = parseInt(extract(minPos)) || 0;
    if (secPos) seconds = parseInt(extract(secPos)) || 0;

    const date = new Date(year, month - 1, day, hours, minutes, seconds);
    
    // 验证日期有效性
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null; // 无效日期（如2月30日）
    }
    
    return date;
  }

  // 获取当年第几周
  _getWeekOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date - start;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil((diff / oneWeek) + 1);
  }

  /**
   * 执行时间函数
   * @param {string} funcName - 函数名
   * @param {object} params - 参数对象
   * @param {object} varContext - 变量上下文
   * @returns {object} { success, result, error }
   */
  executeTimeFunction(funcName, params, varContext = {}) {
    const func = this.timeFunctions[funcName];
    if (!func) {
      return { success: false, error: `未知的时间函数: ${funcName}` };
    }

    try {
      // 解析参数值
      const resolveValue = (param) => {
        if (param === null || param === undefined) return param;
        if (typeof param === 'object' && param.type === 'variable') {
          return varContext[param.varId];
        }
        if (typeof param === 'object' && param.type === 'constant') {
          return param.value;
        }
        if (typeof param === 'object' && param.type === 'now') {
          return new Date();
        }
        return param;
      };

      let result;
      
      switch (funcName) {
        case 'now':
          result = func(params.dateOnly);
          break;
        case 'today':
          result = func();
          break;
        case 'format':
          result = func(resolveValue(params.source), params.pattern);
          break;
        case 'parse':
          result = func(resolveValue(params.source), params.pattern);
          break;
        case 'add':
          result = func(resolveValue(params.source), params.amount, params.unit);
          break;
        case 'getField':
          result = func(resolveValue(params.source), params.field, params.format);
          break;
        case 'setField':
          result = func(resolveValue(params.source), params.field, params.value);
          break;
        case 'diff':
          result = func(resolveValue(params.start), resolveValue(params.end), params.unit, params.round);
          break;
        case 'isBefore':
        case 'isAfter':
          result = func(resolveValue(params.time1), resolveValue(params.time2));
          break;
        case 'toTimestamp':
          result = func(resolveValue(params.source), params.unit);
          break;
        case 'fromTimestamp':
          result = func(resolveValue(params.timestamp), params.unit);
          break;
        case 'startOf':
        case 'endOf':
          result = func(resolveValue(params.source), params.period, params.weekStart);
          break;
        case 'isValid':
          result = func(resolveValue(params.source), params.pattern);
          break;
        default:
          return { success: false, error: `未实现的函数: ${funcName}` };
      }

      // 格式化Date对象为字符串以便显示
      if (result instanceof Date) {
        result = {
          _isDate: true,
          value: result,
          display: this._formatDate(result, 'yyyy-MM-dd HH:mm:ss')
        };
      }

      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 执行聚合函数
   * @param {string} funcName - 函数名
   * @param {Array} values - 数值数组
   * @param {Array} keys - 键数组（可选，用于max/min返回键值对）
   * @returns {any} 计算结果
   */
  executeAggregation(funcName, values, keys = null) {
    const func = this.aggregationFunctions[funcName];
    if (!func) {
      return { error: `未知的聚合函数: ${funcName}` };
    }
    
    try {
      if (funcName === 'max' || funcName === 'min') {
        return func(values, keys);
      } else {
        return func(values);
      }
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * 对表单数据执行聚合
   * @param {string} funcName - 函数名
   * @param {Array} formData - 表单数据数组
   * @param {string} fieldId - 要聚合的字段ID
   * @param {string} keyFieldId - 主键字段ID（可选，用于max/min）
   * @returns {any} 计算结果
   */
  executeAggregationOnForm(funcName, formData, fieldId, keyFieldId = null) {
    if (!Array.isArray(formData) || formData.length === 0) {
      return funcName === 'count' ? 0 : { error: '无数据' };
    }
    
    // 提取列数据
    const values = formData.map(row => row[fieldId]);
    const keys = keyFieldId ? formData.map(row => row[keyFieldId]) : null;
    
    return this.executeAggregation(funcName, values, keys);
  }

  /**
   * 验证Token序列
   * @param {Array} tokens - Token数组
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate(tokens) {
    const errors = [];
    
    if (!tokens || tokens.length === 0) {
      return { valid: false, errors: ['表达式不能为空'] };
    }

    // 检查是否有未填充的占位符
    const placeholders = tokens.filter(t => t.type === 'placeholder');
    if (placeholders.length > 0) {
      errors.push(`有 ${placeholders.length} 个参数未填写`);
    }

    // 检查括号配对
    const bracketError = this.checkBrackets(tokens);
    if (bracketError) {
      errors.push(bracketError);
    }

    // 检查运算符位置
    const operatorError = this.checkOperators(tokens);
    if (operatorError) {
      errors.push(operatorError);
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * 检查括号配对
   */
  checkBrackets(tokens) {
    let depth = 0;
    for (const token of tokens) {
      if (token.type === 'bracket' && token.id === 'lparen') {
        depth++;
      } else if (token.type === 'bracket' && token.id === 'rparen') {
        depth--;
      } else if (token.type === 'function') {
        depth++; // 函数自带左括号
      } else if (token.type === 'function_end') {
        depth--;
      }
      
      if (depth < 0) {
        return '括号不匹配：多余的右括号';
      }
    }
    
    if (depth !== 0) {
      return '括号不匹配：缺少右括号';
    }
    
    return null;
  }

  /**
   * 检查运算符位置是否合法
   */
  checkOperators(tokens) {
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const prevToken = i > 0 ? tokens[i - 1] : null;
      const nextToken = i < tokens.length - 1 ? tokens[i + 1] : null;

      if (token.type === 'operator') {
        // 运算符不能在开头（除了负号，暂不支持）
        if (i === 0) {
          return `运算符 "${token.display}" 不能在表达式开头`;
        }
        
        // 运算符不能在结尾
        if (i === tokens.length - 1) {
          return `运算符 "${token.display}" 不能在表达式结尾`;
        }
        
        // 运算符不能连续出现
        if (prevToken && prevToken.type === 'operator') {
          return `运算符 "${prevToken.display}" 和 "${token.display}" 不能连续出现`;
        }
        
        // 运算符前面不能是左括号或函数开始（除了负号）
        if (prevToken && (
          (prevToken.type === 'bracket' && prevToken.id === 'lparen') ||
          prevToken.type === 'function'
        )) {
          return `运算符 "${token.display}" 前面不能是左括号`;
        }
      }
    }
    
    return null;
  }

  /**
   * 将Token序列转换为可执行表达式字符串
   * @param {Array} tokens - Token数组
   * @returns {String} 表达式字符串
   */
  tokensToExpression(tokens) {
    let expr = '';
    
    for (const token of tokens) {
      switch (token.type) {
        case 'variable':
          expr += `__VAR_${token.id}__`;
          break;
        case 'constant':
          expr += token.value;
          break;
        case 'operator':
          expr += ` ${token.symbol} `;
          break;
        case 'bracket':
          expr += token.symbol;
          break;
        case 'function':
          expr += `__FUNC_${token.id}__(`;
          break;
        case 'function_end':
          expr += ')';
          break;
        case 'separator':
          expr += ', ';
          break;
        case 'placeholder':
          expr += '?'; // 占位符，应该在执行前被替换
          break;
        default:
          expr += token.symbol || '';
      }
    }
    
    return expr;
  }

  /**
   * 生成显示用的表达式文本
   * @param {Array} tokens - Token数组
   * @returns {String} 显示文本
   */
  tokensToDisplayText(tokens) {
    return tokens.map(t => t.display).join('');
  }

  /**
   * 执行表达式
   * @param {Array} tokens - Token数组
   * @param {Object} variables - 变量上下文 { varId: value, ... }
   * @returns {Object} { success: boolean, result: any, error: string }
   */
  execute(tokens, variables = {}) {
    // 先验证
    const validation = this.validate(tokens);
    if (!validation.valid) {
      return {
        success: false,
        result: null,
        error: validation.errors.join('; ')
      };
    }

    try {
      // 转换为表达式字符串
      let expr = this.tokensToExpression(tokens);
      
      // 替换变量（使用简单字符串替换，避免正则问题）
      for (const [varId, value] of Object.entries(variables)) {
        const placeholder = '__VAR_' + varId + '__';
        // 使用split+join代替正则，避免特殊字符问题
        expr = expr.split(placeholder).join(String(value));
      }
      
      // 替换函数调用
      for (const func of window.DND_PRIMITIVES.functions) {
        const funcPlaceholder = '__FUNC_' + func.id + '__';
        expr = expr.split(funcPlaceholder).join('this.safeFunctions.' + func.id);
      }
      
      console.log('执行表达式:', expr);
      
      // 安全执行
      const result = this.safeEval(expr);
      
      return {
        success: true,
        result: result,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        error: error.message
      };
    }
  }

  /**
   * 安全执行表达式
   */
  safeEval(expr) {
    // 使用Function构造器，限制作用域
    const func = new Function('safeFunctions', `
      with (safeFunctions) {
        return ${expr};
      }
    `);
    
    return func.call(this, this.safeFunctions);
  }

  /**
   * 执行衍生字段计算
   * @param {Array} tokens - Token数组
   * @param {Object} record - 数据记录
   * @param {Array} fieldMapping - 字段映射 [{ id, name, type }, ...]
   * @returns {any} 计算结果
   */
  executeForDerived(tokens, record, fieldMapping) {
    // 构建变量上下文
    const variables = {};
    for (const field of fieldMapping) {
      // 注意：字段映射使用 id 属性，不是 fieldId
      const fieldId = field.id || field.fieldId;
      const value = record[fieldId];
      variables[fieldId] = value !== undefined && value !== '' ? Number(value) || 0 : 0;
    }
    
    console.log('衍生计算 - 变量上下文:', variables);
    console.log('衍生计算 - Tokens:', tokens);
    
    const result = this.execute(tokens, variables);
    
    console.log('衍生计算 - 执行结果:', result);
    
    if (result.success) {
      // 格式化结果
      const numResult = result.result;
      if (typeof numResult === 'number') {
        return Number.isInteger(numResult) ? numResult : parseFloat(numResult.toFixed(4));
      }
      return numResult;
    } else {
      console.error('衍生计算错误:', result.error);
      return 'ERROR';
    }
  }

  /**
   * 获取表达式中使用的变量列表
   * @param {Array} tokens - Token数组
   * @returns {Array} 变量ID列表
   */
  getUsedVariables(tokens) {
    return tokens
      .filter(t => t.type === 'variable')
      .map(t => t.id);
  }

  /**
   * 序列化Token数组（用于存储）
   * @param {Array} tokens - Token数组
   * @returns {String} JSON字符串
   */
  serialize(tokens) {
    return JSON.stringify(tokens);
  }

  /**
   * 反序列化Token数组
   * @param {String} jsonStr - JSON字符串
   * @returns {Array} Token数组
   */
  deserialize(jsonStr) {
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error('反序列化失败:', e);
      return [];
    }
  }
}

// 创建全局实例
window.PrimitiveEngine = PrimitiveEngine;
window.primitiveEngine = new PrimitiveEngine();

console.log('DND原语引擎已加载');
