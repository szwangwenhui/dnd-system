/**
 * DND原语定义
 * 定义所有可用的公式原语：括号、运算符、函数
 */

const DND_PRIMITIVES = {
  // 括号原语
  brackets: [
    { 
      id: 'lparen', 
      symbol: '(', 
      display: '(', 
      type: 'bracket',
      description: '左括号',
      pair: 'rparen'
    },
    { 
      id: 'rparen', 
      symbol: ')', 
      display: ')', 
      type: 'bracket',
      description: '右括号',
      pair: 'lparen'
    }
  ],
  
  // 运算符原语
  operators: [
    { 
      id: 'add', 
      symbol: '+', 
      display: '+', 
      type: 'operator', 
      precedence: 1,
      description: '加法'
    },
    { 
      id: 'sub', 
      symbol: '-', 
      display: '-', 
      type: 'operator', 
      precedence: 1,
      description: '减法'
    },
    { 
      id: 'mul', 
      symbol: '*', 
      display: '×', 
      type: 'operator', 
      precedence: 2,
      description: '乘法'
    },
    { 
      id: 'div', 
      symbol: '/', 
      display: '÷', 
      type: 'operator', 
      precedence: 2,
      description: '除法'
    }
  ],
  
  // 函数原语
  functions: [
    { 
      id: 'round', 
      symbol: 'round', 
      display: 'round(▢,▢)', 
      type: 'function',
      params: [
        { name: 'value', label: '数值', type: 'number' },
        { name: 'decimals', label: '小数位', type: 'number', default: 0 }
      ],
      description: '四舍五入',
      example: 'round(3.456, 2) → 3.46'
    },
    { 
      id: 'abs', 
      symbol: 'abs', 
      display: 'abs(▢)', 
      type: 'function',
      params: [
        { name: 'value', label: '数值', type: 'number' }
      ],
      description: '绝对值',
      example: 'abs(-5) → 5'
    },
    { 
      id: 'sqrt', 
      symbol: 'sqrt', 
      display: 'sqrt(▢)', 
      type: 'function',
      params: [
        { name: 'value', label: '数值', type: 'number' }
      ],
      description: '平方根',
      example: 'sqrt(9) → 3'
    },
    { 
      id: 'floor', 
      symbol: 'floor', 
      display: 'floor(▢)', 
      type: 'function',
      params: [
        { name: 'value', label: '数值', type: 'number' }
      ],
      description: '向下取整',
      example: 'floor(3.7) → 3'
    },
    { 
      id: 'ceil', 
      symbol: 'ceil', 
      display: 'ceil(▢)', 
      type: 'function',
      params: [
        { name: 'value', label: '数值', type: 'number' }
      ],
      description: '向上取整',
      example: 'ceil(3.2) → 4'
    }
  ],

  // 字符串函数（20个）
  stringFunctions: [
    {
      id: 'str_length',
      symbol: 'length',
      name: '获取长度',
      type: 'stringFunction',
      params: [
        { name: 'source', label: '源字符串', type: 'string', inputType: 'varOrConst' }
      ],
      returnType: 'number',
      description: '获取字符串长度',
      example: 'length("hello") → 5'
    },
    {
      id: 'str_concat',
      symbol: 'concat',
      name: '字符串拼接',
      type: 'stringFunction',
      params: [
        { name: 'items', label: '拼接内容', type: 'array', inputType: 'multiVarOrConst', minItems: 2 }
      ],
      returnType: 'string',
      description: '拼接多个字符串',
      example: 'concat("张", "三丰") → "张三丰"'
    },
    {
      id: 'str_substring',
      symbol: 'substring',
      name: '按位置截取',
      type: 'stringFunction',
      params: [
        { name: 'source', label: '源字符串', type: 'string', inputType: 'varOrConst' },
        { name: 'start', label: '开始位置', type: 'number', inputType: 'number', default: 0 },
        { name: 'end', label: '结束位置', type: 'number', inputType: 'numberOrEnd', default: null, allowEnd: true }
      ],
      returnType: 'string',
      description: '按位置截取字符串',
      example: 'substring("hello", 0, 2) → "he"'
    },
    {
      id: 'str_left',
      symbol: 'left',
      name: '左截取',
      type: 'stringFunction',
      params: [
        { name: 'source', label: '源字符串', type: 'string', inputType: 'varOrConst' },
        { name: 'length', label: '截取长度', type: 'number', inputType: 'number' }
      ],
      returnType: 'string',
      description: '从左边截取指定长度',
      example: 'left("hello", 2) → "he"'
    },
    {
      id: 'str_right',
      symbol: 'right',
      name: '右截取',
      type: 'stringFunction',
      params: [
        { name: 'source', label: '源字符串', type: 'string', inputType: 'varOrConst' },
        { name: 'length', label: '截取长度', type: 'number', inputType: 'number' }
      ],
      returnType: 'string',
      description: '从右边截取指定长度',
      example: 'right("hello", 2) → "lo"'
    },
    {
      id: 'str_remove',
      symbol: 'remove',
      name: '截取子串',
      type: 'stringFunction',
      params: [
        { name: 'source', label: '源字符串', type: 'string', inputType: 'varOrConst' },
        { name: 'target', label: '截掉字段', type: 'string', inputType: 'varOrConst' },
        { name: 'ignoreCase', label: '忽略大小写', type: 'boolean', inputType: 'checkbox', default: false },
        { name: 'removeAll', label: '全部匹配项', type: 'boolean', inputType: 'radio', options: ['全部匹配项', '仅首个'], default: true }
      ],
      returnType: 'string',
      description: '从字符串中移除子串',
      example: 'remove("hello world", "world") → "hello "'
    },
    {
      id: 'str_replace',
      symbol: 'replace',
      name: '替换',
      type: 'stringFunction',
      params: [
        { name: 'source', label: '源字符串', type: 'string', inputType: 'varOrConst' },
        { name: 'find', label: '查找内容', type: 'string', inputType: 'const' },
        { name: 'replacement', label: '替换为', type: 'string', inputType: 'const' },
        { name: 'replaceAll', label: '替换模式', type: 'boolean', inputType: 'radio', options: ['全部替换', '仅首个'], default: true }
      ],
      returnType: 'string',
      description: '替换字符串内容',
      example: 'replace("hello", "l", "L") → "heLLo"'
    },
    {
      id: 'str_indexOf',
      symbol: 'indexOf',
      name: '查找位置',
      type: 'stringFunction',
      params: [
        { name: 'source', label: '源字符串', type: 'string', inputType: 'varOrConst' },
        { name: 'search', label: '查找内容', type: 'string', inputType: 'const' },
        { name: 'startIndex', label: '起始位置', type: 'number', inputType: 'number', default: 0, optional: true }
      ],
      returnType: 'number',
      description: '查找子串位置（未找到返回-1）',
      example: 'indexOf("hello", "l") → 2'
    },
    {
      id: 'str_toUpperCase',
      symbol: 'toUpperCase',
      name: '转大写',
      type: 'stringFunction',
      params: [
        { name: 'source', label: '源字符串', type: 'string', inputType: 'varOrConst' }
      ],
      returnType: 'string',
      description: '转换为大写',
      example: 'toUpperCase("hello") → "HELLO"'
    },
    {
      id: 'str_toLowerCase',
      symbol: 'toLowerCase',
      name: '转小写',
      type: 'stringFunction',
      params: [
        { name: 'source', label: '源字符串', type: 'string', inputType: 'varOrConst' }
      ],
      returnType: 'string',
      description: '转换为小写',
      example: 'toLowerCase("HELLO") → "hello"'
    },
    {
      id: 'str_trim',
      symbol: 'trim',
      name: '去空格',
      type: 'stringFunction',
      params: [
        { name: 'source', label: '源字符串', type: 'string', inputType: 'varOrConst' },
        { name: 'mode', label: '去除方式', type: 'string', inputType: 'radio', options: ['两端', '仅左侧', '仅右侧'], default: '两端' }
      ],
      returnType: 'string',
      description: '去除空格',
      example: 'trim("  hello  ") → "hello"'
    },
    {
      id: 'str_split',
      symbol: 'split',
      name: '分割',
      type: 'stringFunction',
      params: [
        { name: 'source', label: '源字符串', type: 'string', inputType: 'varOrConst' },
        { name: 'separator', label: '分隔符', type: 'string', inputType: 'const' },
        { name: 'limit', label: '最大分割数', type: 'number', inputType: 'number', optional: true }
      ],
      returnType: 'array',
      description: '按分隔符分割字符串',
      example: 'split("a,b,c", ",") → ["a","b","c"]'
    },
    {
      id: 'str_contains',
      symbol: 'contains',
      name: '判断包含',
      type: 'stringFunction',
      params: [
        { name: 'source', label: '源字符串', type: 'string', inputType: 'varOrConst' },
        { name: 'search', label: '查找内容', type: 'string', inputType: 'const' },
        { name: 'ignoreCase', label: '忽略大小写', type: 'boolean', inputType: 'checkbox', default: false }
      ],
      returnType: 'boolean',
      description: '判断是否包含子串',
      example: 'contains("hello", "ell") → true'
    },
    {
      id: 'str_startsWith',
      symbol: 'startsWith',
      name: '判断开头',
      type: 'stringFunction',
      params: [
        { name: 'source', label: '源字符串', type: 'string', inputType: 'varOrConst' },
        { name: 'prefix', label: '前缀内容', type: 'string', inputType: 'const' },
        { name: 'ignoreCase', label: '忽略大小写', type: 'boolean', inputType: 'checkbox', default: false }
      ],
      returnType: 'boolean',
      description: '判断是否以指定内容开头',
      example: 'startsWith("hello", "he") → true'
    },
    {
      id: 'str_endsWith',
      symbol: 'endsWith',
      name: '判断结尾',
      type: 'stringFunction',
      params: [
        { name: 'source', label: '源字符串', type: 'string', inputType: 'varOrConst' },
        { name: 'suffix', label: '后缀内容', type: 'string', inputType: 'const' },
        { name: 'ignoreCase', label: '忽略大小写', type: 'boolean', inputType: 'checkbox', default: false }
      ],
      returnType: 'boolean',
      description: '判断是否以指定内容结尾',
      example: 'endsWith("hello", "lo") → true'
    },
    {
      id: 'str_isEmpty',
      symbol: 'isEmpty',
      name: '判空',
      type: 'stringFunction',
      params: [
        { name: 'source', label: '源字符串', type: 'string', inputType: 'varOrConst' },
        { name: 'mode', label: '判断模式', type: 'string', inputType: 'radio', options: ['严格空', '包含空白', '包含null'], default: '严格空' }
      ],
      returnType: 'boolean',
      description: '判断字符串是否为空',
      example: 'isEmpty("") → true'
    },
    {
      id: 'str_padStart',
      symbol: 'padStart',
      name: '左填充',
      type: 'stringFunction',
      params: [
        { name: 'source', label: '源字符串', type: 'string', inputType: 'varOrConst' },
        { name: 'length', label: '目标长度', type: 'number', inputType: 'number' },
        { name: 'padChar', label: '填充字符', type: 'string', inputType: 'const', default: ' ' }
      ],
      returnType: 'string',
      description: '在左侧填充字符到指定长度',
      example: 'padStart("5", 3, "0") → "005"'
    },
    {
      id: 'str_padEnd',
      symbol: 'padEnd',
      name: '右填充',
      type: 'stringFunction',
      params: [
        { name: 'source', label: '源字符串', type: 'string', inputType: 'varOrConst' },
        { name: 'length', label: '目标长度', type: 'number', inputType: 'number' },
        { name: 'padChar', label: '填充字符', type: 'string', inputType: 'const', default: ' ' }
      ],
      returnType: 'string',
      description: '在右侧填充字符到指定长度',
      example: 'padEnd("5", 3, "0") → "500"'
    },
    {
      id: 'str_repeat',
      symbol: 'repeat',
      name: '重复',
      type: 'stringFunction',
      params: [
        { name: 'source', label: '源字符串', type: 'string', inputType: 'varOrConst' },
        { name: 'count', label: '重复次数', type: 'number', inputType: 'number' }
      ],
      returnType: 'string',
      description: '重复字符串指定次数',
      example: 'repeat("ab", 3) → "ababab"'
    },
    {
      id: 'str_format',
      symbol: 'format',
      name: '格式化',
      type: 'stringFunction',
      params: [
        { name: 'template', label: '模板字符串', type: 'string', inputType: 'const', placeholder: '使用{}作为占位符' },
        { name: 'args', label: '参数列表', type: 'array', inputType: 'multiVarOrConst', minItems: 1 }
      ],
      returnType: 'string',
      description: '格式化字符串，用参数替换{}占位符',
      example: 'format("{}你好", "张三") → "张三你好"'
    }
  ],

  // 时间函数（15个）
  timeFunctions: [
    {
      id: 'time_now',
      symbol: 'now',
      name: '获取当前时间',
      type: 'timeFunction',
      params: [
        { name: 'dateOnly', label: '仅日期', type: 'boolean', inputType: 'checkbox', default: false }
      ],
      returnType: 'datetime',
      description: '获取当前时间',
      example: 'now() → "2025-12-23 14:30:25"'
    },
    {
      id: 'time_today',
      symbol: 'today',
      name: '获取当前日期',
      type: 'timeFunction',
      params: [],
      returnType: 'date',
      description: '获取当前日期（时间为00:00:00）',
      example: 'today() → "2025-12-23"'
    },
    {
      id: 'time_format',
      symbol: 'format',
      name: '时间格式化',
      type: 'timeFunction',
      params: [
        { name: 'source', label: '源时间', type: 'datetime', inputType: 'timeVarOrNow' },
        { name: 'pattern', label: '格式模板', type: 'string', inputType: 'formatPattern', default: 'yyyy-MM-dd HH:mm:ss' }
      ],
      returnType: 'string',
      description: '将时间格式化为字符串',
      example: 'format(now(), "yyyy年MM月dd日") → "2025年12月23日"'
    },
    {
      id: 'time_parse',
      symbol: 'parse',
      name: '解析时间',
      type: 'timeFunction',
      params: [
        { name: 'source', label: '时间字符串', type: 'string', inputType: 'varOrConst' },
        { name: 'pattern', label: '格式模板', type: 'string', inputType: 'formatPattern', default: 'yyyy-MM-dd' }
      ],
      returnType: 'datetime',
      description: '将字符串解析为时间',
      example: 'parse("2025-12-23", "yyyy-MM-dd") → Date对象'
    },
    {
      id: 'time_add',
      symbol: 'add',
      name: '时间加减',
      type: 'timeFunction',
      params: [
        { name: 'source', label: '基准时间', type: 'datetime', inputType: 'timeVarOrNow' },
        { name: 'amount', label: '数量', type: 'number', inputType: 'number', default: 1 },
        { name: 'unit', label: '单位', type: 'string', inputType: 'select', options: ['年', '月', '周', '天', '时', '分', '秒'], default: '天' }
      ],
      returnType: 'datetime',
      description: '时间加减（负数为减）',
      example: 'add(now(), 7, "天") → 7天后'
    },
    {
      id: 'time_getField',
      symbol: 'getField',
      name: '获取时间字段',
      type: 'timeFunction',
      params: [
        { name: 'source', label: '源时间', type: 'datetime', inputType: 'timeVarOrNow' },
        { name: 'field', label: '字段', type: 'string', inputType: 'select', options: ['年度', '季度', '月度', '周度', '旬度', '月度日', '周度日', '小时', '分钟', '秒'], default: '年度' },
        { name: 'format', label: '格式', type: 'string', inputType: 'fieldFormat', default: '数字' }
      ],
      returnType: 'number|string',
      description: '获取时间的指定字段',
      example: 'getField(now(), "季度") → 4'
    },
    {
      id: 'time_setField',
      symbol: 'setField',
      name: '设置时间字段',
      type: 'timeFunction',
      params: [
        { name: 'source', label: '源时间', type: 'datetime', inputType: 'timeVarOrNow' },
        { name: 'field', label: '字段', type: 'string', inputType: 'select', options: ['年度', '月度', '月度日', '小时', '分钟', '秒'], default: '年度' },
        { name: 'value', label: '设置值', type: 'number', inputType: 'number' }
      ],
      returnType: 'datetime',
      description: '设置时间的指定字段',
      example: 'setField(now(), "月度", 6) → 改为6月'
    },
    {
      id: 'time_diff',
      symbol: 'diff',
      name: '计算时间差',
      type: 'timeFunction',
      params: [
        { name: 'start', label: '开始时间', type: 'datetime', inputType: 'timeVarOrConst' },
        { name: 'end', label: '结束时间', type: 'datetime', inputType: 'timeVarOrNow' },
        { name: 'unit', label: '返回单位', type: 'string', inputType: 'select', options: ['年', '月', '周', '天', '时', '分', '秒'], default: '天' },
        { name: 'round', label: '取整方式', type: 'string', inputType: 'select', options: ['向下取整', '四舍五入', '保留小数'], default: '向下取整' }
      ],
      returnType: 'number',
      description: '计算两个时间的差值',
      example: 'diff("2025-01-01", now(), "天") → 357'
    },
    {
      id: 'time_isBefore',
      symbol: 'isBefore',
      name: '是否在之前',
      type: 'timeFunction',
      params: [
        { name: 'time1', label: '时间1', type: 'datetime', inputType: 'timeVarOrConst' },
        { name: 'time2', label: '时间2', type: 'datetime', inputType: 'timeVarOrNow' }
      ],
      returnType: 'boolean',
      description: '判断时间1是否在时间2之前',
      example: 'isBefore("2025-12-20", now()) → true'
    },
    {
      id: 'time_isAfter',
      symbol: 'isAfter',
      name: '是否在之后',
      type: 'timeFunction',
      params: [
        { name: 'time1', label: '时间1', type: 'datetime', inputType: 'timeVarOrConst' },
        { name: 'time2', label: '时间2', type: 'datetime', inputType: 'timeVarOrNow' }
      ],
      returnType: 'boolean',
      description: '判断时间1是否在时间2之后',
      example: 'isAfter("2025-12-25", now()) → true'
    },
    {
      id: 'time_toTimestamp',
      symbol: 'toTimestamp',
      name: '转时间戳',
      type: 'timeFunction',
      params: [
        { name: 'source', label: '源时间', type: 'datetime', inputType: 'timeVarOrNow' },
        { name: 'unit', label: '时间戳类型', type: 'string', inputType: 'radio', options: ['毫秒', '秒'], default: '毫秒' }
      ],
      returnType: 'number',
      description: '时间转为时间戳',
      example: 'toTimestamp(now()) → 1734567890123'
    },
    {
      id: 'time_fromTimestamp',
      symbol: 'fromTimestamp',
      name: '时间戳转时间',
      type: 'timeFunction',
      params: [
        { name: 'timestamp', label: '时间戳', type: 'number', inputType: 'varOrConst' },
        { name: 'unit', label: '时间戳类型', type: 'string', inputType: 'radio', options: ['毫秒', '秒'], default: '毫秒' }
      ],
      returnType: 'datetime',
      description: '时间戳转为时间',
      example: 'fromTimestamp(1734567890123) → "2025-12-19 10:31:30"'
    },
    {
      id: 'time_startOf',
      symbol: 'startOf',
      name: '获取周期开始',
      type: 'timeFunction',
      params: [
        { name: 'source', label: '源时间', type: 'datetime', inputType: 'timeVarOrNow' },
        { name: 'period', label: '周期类型', type: 'string', inputType: 'select', options: ['年', '季度', '月', '周', '天', '时'], default: '月' },
        { name: 'weekStart', label: '周起始日', type: 'string', inputType: 'select', options: ['周一', '周日'], default: '周一', showWhen: { field: 'period', value: '周' } }
      ],
      returnType: 'datetime',
      description: '获取周期的开始时间',
      example: 'startOf(now(), "月") → "2025-12-01 00:00:00"'
    },
    {
      id: 'time_endOf',
      symbol: 'endOf',
      name: '获取周期结束',
      type: 'timeFunction',
      params: [
        { name: 'source', label: '源时间', type: 'datetime', inputType: 'timeVarOrNow' },
        { name: 'period', label: '周期类型', type: 'string', inputType: 'select', options: ['年', '季度', '月', '周', '天', '时'], default: '月' },
        { name: 'weekStart', label: '周起始日', type: 'string', inputType: 'select', options: ['周一', '周日'], default: '周一', showWhen: { field: 'period', value: '周' } }
      ],
      returnType: 'datetime',
      description: '获取周期的结束时间',
      example: 'endOf(now(), "月") → "2025-12-31 23:59:59"'
    },
    {
      id: 'time_isValid',
      symbol: 'isValid',
      name: '判断有效时间',
      type: 'timeFunction',
      params: [
        { name: 'source', label: '待检测值', type: 'string', inputType: 'varOrConst' },
        { name: 'pattern', label: '格式模板', type: 'string', inputType: 'formatPattern', optional: true, placeholder: '留空自动检测' }
      ],
      returnType: 'boolean',
      description: '判断是否为有效的时间',
      example: 'isValid("2025-02-30") → false'
    }
  ],

  // 聚合函数（对数组/列进行操作）
  aggregations: [
    {
      id: 'sum',
      symbol: 'sum',
      display: 'sum(列)',
      type: 'aggregation',
      params: [
        { name: 'column', label: '列/数组', type: 'array' }
      ],
      description: '求和',
      example: 'sum([1,2,3,4,5]) → 15',
      returnType: 'number'
    },
    {
      id: 'avg',
      symbol: 'avg',
      display: 'avg(列)',
      type: 'aggregation',
      params: [
        { name: 'column', label: '列/数组', type: 'array' }
      ],
      description: '平均值',
      example: 'avg([1,2,3,4,5]) → 3',
      returnType: 'number'
    },
    {
      id: 'count',
      symbol: 'count',
      display: 'count(列)',
      type: 'aggregation',
      params: [
        { name: 'column', label: '列/数组', type: 'array' }
      ],
      description: '计数',
      example: 'count([1,2,3,4,5]) → 5',
      returnType: 'number'
    },
    {
      id: 'max',
      symbol: 'max',
      display: 'max(列)',
      type: 'aggregation',
      params: [
        { name: 'column', label: '列/数组', type: 'array' }
      ],
      description: '最大值',
      example: 'max([1,2,3,4,5]) → {index: 4, value: 5}',
      returnType: 'keyValue'  // 返回键值对
    },
    {
      id: 'min',
      symbol: 'min',
      display: 'min(列)',
      type: 'aggregation',
      params: [
        { name: 'column', label: '列/数组', type: 'array' }
      ],
      description: '最小值',
      example: 'min([1,2,3,4,5]) → {index: 0, value: 1}',
      returnType: 'keyValue'  // 返回键值对
    }
  ],

  // 分隔符
  separators: [
    {
      id: 'comma',
      symbol: ',',
      display: ',',
      type: 'separator',
      description: '参数分隔符'
    }
  ]
};

// 函数分类定义
const FUNCTION_CATEGORIES = {
  arithmetic: {
    id: 'arithmetic',
    name: '四则运算',
    icon: '📐',
    description: '括号和四则运算符',
    primitives: ['brackets', 'operators']
  },
  math: {
    id: 'math',
    name: '数学公式',
    icon: '📊',
    description: '数学函数：round, abs, sqrt, floor, ceil',
    primitives: ['functions']
  },
  aggregation: {
    id: 'aggregation',
    name: '聚合计算',
    icon: '📈',
    description: '统计函数：sum, avg, count, max, min',
    primitives: ['aggregations']
  },
  string: {
    id: 'string',
    name: '字符串函数',
    icon: '📝',
    description: '字符串处理：拼接、截取、替换、查找等',
    primitives: ['stringFunctions']
  },
  time: {
    id: 'time',
    name: '时间函数',
    icon: '⏰',
    description: '时间处理：格式化、加减、比较、字段提取等',
    primitives: ['timeFunctions']
  }
};

// Token类型枚举
const TOKEN_TYPES = {
  BRACKET: 'bracket',
  OPERATOR: 'operator',
  FUNCTION: 'function',
  FUNCTION_END: 'function_end',
  SEPARATOR: 'separator',
  VARIABLE: 'variable',
  CONSTANT: 'constant',
  PLACEHOLDER: 'placeholder'  // 函数参数占位符 ▢
};

// 创建Token的工厂函数
const TokenFactory = {
  // 创建括号Token
  bracket: (bracketId) => {
    const bracket = DND_PRIMITIVES.brackets.find(b => b.id === bracketId);
    if (!bracket) return null;
    return {
      type: TOKEN_TYPES.BRACKET,
      id: bracket.id,
      symbol: bracket.symbol,
      display: bracket.display
    };
  },

  // 创建运算符Token
  operator: (operatorId) => {
    const op = DND_PRIMITIVES.operators.find(o => o.id === operatorId);
    if (!op) return null;
    return {
      type: TOKEN_TYPES.OPERATOR,
      id: op.id,
      symbol: op.symbol,
      display: op.display,
      precedence: op.precedence
    };
  },

  // 创建函数开始Token（包含占位符）
  functionStart: (functionId) => {
    const func = DND_PRIMITIVES.functions.find(f => f.id === functionId);
    if (!func) return null;
    
    // 返回函数Token数组：函数名 + ( + 占位符们 + )
    const tokens = [
      {
        type: TOKEN_TYPES.FUNCTION,
        id: func.id,
        symbol: func.symbol,
        display: func.symbol + '(',
        params: func.params
      }
    ];
    
    // 添加参数占位符
    func.params.forEach((param, idx) => {
      if (idx > 0) {
        tokens.push({
          type: TOKEN_TYPES.SEPARATOR,
          id: 'comma',
          symbol: ',',
          display: ','
        });
      }
      tokens.push({
        type: TOKEN_TYPES.PLACEHOLDER,
        id: `placeholder_${idx}`,
        paramIndex: idx,
        paramName: param.name,
        paramLabel: param.label,
        display: '▢'
      });
    });
    
    // 添加函数结束括号
    tokens.push({
      type: TOKEN_TYPES.FUNCTION_END,
      id: func.id + '_end',
      symbol: ')',
      display: ')'
    });
    
    return tokens;
  },

  // 创建变量Token
  variable: (varId, varName, varType = 'number') => {
    return {
      type: TOKEN_TYPES.VARIABLE,
      id: varId,
      name: varName,
      varType: varType,
      symbol: varId,
      display: `[${varName}]`
    };
  },

  // 创建常量Token
  constant: (value) => {
    return {
      type: TOKEN_TYPES.CONSTANT,
      id: `const_${Date.now()}`,
      value: value,
      symbol: String(value),
      display: String(value)
    };
  },

  // 创建分隔符Token
  separator: () => {
    return {
      type: TOKEN_TYPES.SEPARATOR,
      id: 'comma',
      symbol: ',',
      display: ','
    };
  }
};

// 导出到全局
window.DND_PRIMITIVES = DND_PRIMITIVES;
window.FUNCTION_CATEGORIES = FUNCTION_CATEGORIES;
window.TOKEN_TYPES = TOKEN_TYPES;
window.TokenFactory = TokenFactory;

console.log('DND原语系统已加载，包含：', 
  DND_PRIMITIVES.brackets.length, '个括号，',
  DND_PRIMITIVES.operators.length, '个运算符，',
  DND_PRIMITIVES.functions.length, '个数学函数，',
  DND_PRIMITIVES.aggregations.length, '个聚合函数，',
  DND_PRIMITIVES.stringFunctions.length, '个字符串函数，',
  DND_PRIMITIVES.timeFunctions.length, '个时间函数'
);
