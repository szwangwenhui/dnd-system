/**
 * 表达式类型配置
 * 用于衍生表的字段计算
 */

const ExpressionTypes = {
  // 加法表达式
  ADDITION: {
    code: 'addition',
    name: '加法',
    description: '对多个数值型字段求和',
    
    /**
     * 验证表达式配置是否有效
     * @param {Object} expression - 表达式配置对象
     * @param {Array} fields - 可用字段列表
     * @returns {Object} { valid: boolean, message: string }
     */
    validate: function(expression, fields) {
      if (!expression.variables || !Array.isArray(expression.variables)) {
        return { valid: false, message: '加法变量未配置' };
      }
      
      if (expression.variables.length === 0) {
        return { valid: false, message: '至少需要选择一个加法变量' };
      }
      
      // 验证所有变量都是数值型
      for (const fieldId of expression.variables) {
        const field = fields.find(f => f.id === fieldId);
        if (!field) {
          return { valid: false, message: `字段 ${fieldId} 不存在` };
        }
        if (field.type !== '整数型' && field.type !== '浮点型') {
          return { 
            valid: false, 
            message: `字段 ${field.name} 不是数值类型，不能用于加法运算` 
          };
        }
      }
      
      return { valid: true, message: '表达式配置有效' };
    },
    
    /**
     * 计算表达式结果
     * @param {Object} expression - 表达式配置对象
     * @param {Object} data - 数据行对象
     * @returns {number} 计算结果
     */
    calculate: function(expression, data) {
      let sum = 0;
      
      expression.variables.forEach(fieldId => {
        const value = parseFloat(data[fieldId]);
        if (!isNaN(value)) {
          sum += value;
        }
      });
      
      return sum;
    },
    
    /**
     * 获取表达式的可读描述
     * @param {Object} expression - 表达式配置对象
     * @param {Array} fields - 字段列表
     * @returns {string} 可读描述
     */
    getDescription: function(expression, fields) {
      const fieldNames = expression.variables.map(fieldId => {
        const field = fields.find(f => f.id === fieldId);
        return field ? field.name : fieldId;
      });
      
      return fieldNames.join(' + ');
    }
  }
  
  // 未来可以在这里添加更多表达式类型：
  // SUBTRACTION: { ... },  // 减法
  // MULTIPLICATION: { ... },  // 乘法
  // DIVISION: { ... },  // 除法
  // AVERAGE: { ... },  // 平均值
  // CONDITION: { ... }  // 条件判断
};

/**
 * 根据表达式类型代码获取表达式配置
 * @param {string} typeCode - 表达式类型代码（如 'addition'）
 * @returns {Object|null} 表达式配置对象
 */
function getExpressionType(typeCode) {
  return Object.values(ExpressionTypes).find(type => type.code === typeCode) || null;
}

/**
 * 获取所有可用的表达式类型列表
 * @returns {Array} 表达式类型列表
 */
function getAllExpressionTypes() {
  return Object.values(ExpressionTypes);
}

/**
 * 验证并计算表达式
 * @param {Object} expression - 表达式配置对象
 * @param {Object} data - 数据行对象
 * @param {Array} fields - 字段列表
 * @returns {Object} { success: boolean, result: any, error: string }
 */
function evaluateExpression(expression, data, fields) {
  const expressionType = getExpressionType(expression.type);
  
  if (!expressionType) {
    return { 
      success: false, 
      result: null, 
      error: `未知的表达式类型: ${expression.type}` 
    };
  }
  
  // 验证表达式配置
  const validation = expressionType.validate(expression, fields);
  if (!validation.valid) {
    return { 
      success: false, 
      result: null, 
      error: validation.message 
    };
  }
  
  // 计算结果
  try {
    const result = expressionType.calculate(expression, data);
    return { 
      success: true, 
      result: result, 
      error: null 
    };
  } catch (error) {
    return { 
      success: false, 
      result: null, 
      error: `计算错误: ${error.message}` 
    };
  }
}

// 导出到全局
window.ExpressionTypes = ExpressionTypes;
window.getExpressionType = getExpressionType;
window.getAllExpressionTypes = getAllExpressionTypes;
window.evaluateExpression = evaluateExpression;