/**
 * 表达式计算引擎
 * 支持：四则运算、括号、基本数学函数、变量语法
 */
class ExpressionEngine {
  constructor() {
    // 注册支持的函数
    this.functions = {
      'round': (x, n = 0) => {
        const factor = Math.pow(10, n);
        return Math.round(x * factor) / factor;
      },
      'max': Math.max,
      'min': Math.min,
      'abs': Math.abs,
      'sqrt': Math.sqrt,
      'pow': Math.pow,
      'floor': Math.floor,
      'ceil': Math.ceil,
      'if': (condition, trueVal, falseVal) => condition ? trueVal : falseVal,
      'length': (str) => str ? String(str).length : 0,
      'substr': (str, start, len) => str ? String(str).substr(start, len) : '',
      'upper': (str) => str ? String(str).toUpperCase() : '',
      'lower': (str) => str ? String(str).toLowerCase() : '',
      'trim': (str) => str ? String(str).trim() : '',
      'concat': (...args) => args.join(''),
      'now': () => new Date().toISOString(),
      'today': () => new Date().toISOString().split('T')[0]
    };
  }

  /**
   * 计算表达式
   * @param {String} expression - 表达式字符串，如 "F001 + F002"
   * @param {Object} context - 变量上下文，如 {F001: 85, F002: 90}
   * @returns {Number|String} 计算结果
   */
  evaluate(expression, context) {
    if (!expression || expression.trim() === '') {
      return null;
    }

    try {
      // 替换字段ID为实际值
      let processedExpr = expression;
      
      // 按字段ID长度排序，避免F001被F01替换的问题
      const fieldIds = Object.keys(context).sort((a, b) => b.length - a.length);
      
      for (const fieldId of fieldIds) {
        const value = context[fieldId];
        // 将字段ID替换为值
        const regex = new RegExp('\\b' + fieldId + '\\b', 'g');
        const numValue = value !== null && value !== undefined && value !== '' ? Number(value) : 0;
        processedExpr = processedExpr.replace(regex, numValue);
      }

      // 替换函数调用
      for (const funcName in this.functions) {
        const regex = new RegExp('\\b' + funcName + '\\s*\\(', 'g');
        if (regex.test(processedExpr)) {
          // 不能直接替换，需要保留this.functions的引用
          processedExpr = processedExpr.replace(
            new RegExp('\\b' + funcName + '\\s*\\(', 'g'),
            `__functions__.${funcName}(`
          );
        }
      }

      // 使用Function构造器安全执行
      const func = new Function('__functions__', `
        return ${processedExpr};
      `);
      
      const result = func(this.functions);
      return result;
    } catch (error) {
      console.error('表达式计算错误:', expression, error);
      return '计算错误';
    }
  }

  /**
   * 计算结构化表达式（用于VariableExpressionBuilder生成的表达式）
   * @param {Object} expression - 结构化表达式 { left, operator, right }
   * @param {Object} variables - 变量上下文 { variableId: value, ... }
   * @returns {*} 计算结果
   */
  evaluateStructured(expression, variables) {
    if (!expression) return null;

    try {
      // 获取左值
      const leftValue = this.resolveOperand(expression.left, variables);
      
      // 如果是简单赋值模式（没有运算符或右值）
      if (!expression.operator || !expression.right) {
        return leftValue;
      }

      // 获取右值
      const rightValue = this.resolveOperand(expression.right, variables);

      // 执行运算
      return this.performOperation(leftValue, expression.operator, rightValue);
    } catch (error) {
      console.error('结构化表达式计算错误:', expression, error);
      return null;
    }
  }

  /**
   * 解析操作数的值
   * @param {Object} operand - 操作数配置 { type, variableId, path, constantValue, constantType }
   * @param {Object} variables - 变量上下文
   * @returns {*} 解析后的值
   */
  resolveOperand(operand, variables) {
    if (!operand) return null;

    if (operand.type === 'constant') {
      // 常量
      switch (operand.constantType) {
        case 'number':
          return Number(operand.constantValue) || 0;
        case 'boolean':
          return operand.constantValue === 'true';
        default:
          return operand.constantValue || '';
      }
    } else {
      // 变量
      let varId = operand.variableId;
      if (!varId) return null;

      // 去掉$前缀（如果有）
      const normalizedId = varId.startsWith('$') ? varId.substring(1) : varId;
      
      // 先尝试带$的ID，再尝试不带$的ID
      let value = variables[varId] !== undefined ? variables[varId] : variables[normalizedId];

      // 如果有属性路径，获取嵌套值
      if (operand.path && value && typeof value === 'object') {
        const pathParts = operand.path.split('.');
        for (const part of pathParts) {
          if (value && typeof value === 'object') {
            value = value[part];
          } else {
            value = undefined;
            break;
          }
        }
      }

      return value;
    }
  }

  /**
   * 执行运算
   * @param {*} left - 左值
   * @param {String} operator - 运算符
   * @param {*} right - 右值
   * @returns {*} 运算结果
   */
  performOperation(left, operator, right) {
    switch (operator) {
      // 算术运算
      case '+':
        // 字符串拼接或数值相加
        if (typeof left === 'string' || typeof right === 'string') {
          return String(left ?? '') + String(right ?? '');
        }
        return (Number(left) || 0) + (Number(right) || 0);
      case '-':
        return (Number(left) || 0) - (Number(right) || 0);
      case '*':
        return (Number(left) || 0) * (Number(right) || 0);
      case '/':
        const divisor = Number(right) || 0;
        if (divisor === 0) return 0; // 避免除零
        return (Number(left) || 0) / divisor;
      case '%':
        return (Number(left) || 0) % (Number(right) || 1);

      // 比较运算
      case '==':
        return left == right;
      case '!=':
        return left != right;
      case '>':
        return Number(left) > Number(right);
      case '>=':
        return Number(left) >= Number(right);
      case '<':
        return Number(left) < Number(right);
      case '<=':
        return Number(left) <= Number(right);

      // 逻辑运算
      case '&&':
        return Boolean(left) && Boolean(right);
      case '||':
        return Boolean(left) || Boolean(right);

      default:
        console.warn('未知运算符:', operator);
        return left;
    }
  }

  /**
   * 生成表达式文本（从结构化表达式）
   * @param {Object} expression - 结构化表达式
   * @returns {String} 表达式文本
   */
  generateText(expression) {
    if (!expression) return '';

    const leftText = this.operandToText(expression.left);
    
    if (!expression.operator || !expression.right) {
      return leftText;
    }

    const rightText = this.operandToText(expression.right);
    return `${leftText} ${expression.operator} ${rightText}`;
  }

  /**
   * 操作数转文本
   */
  operandToText(operand) {
    if (!operand) return '?';

    if (operand.type === 'constant') {
      if (operand.constantType === 'string') {
        return `"${operand.constantValue || ''}"`;
      }
      return String(operand.constantValue ?? '0');
    } else {
      const varName = operand.variableId?.startsWith('$') 
        ? operand.variableId 
        : `$${operand.variableId || '?'}`;
      if (operand.path) {
        return `${varName}.${operand.path}`;
      }
      return varName;
    }
  }

  /**
   * 验证表达式语法
   * @param {String} expression
   * @returns {Object} {valid: boolean, error: string}
   */
  validate(expression) {
    if (!expression || expression.trim() === '') {
      return { valid: false, error: '表达式不能为空' };
    }

    try {
      // 简单的语法检查
      const testContext = { F001: 1, F002: 2, F003: 3 };
      this.evaluate(expression, testContext);
      return { valid: true, error: null };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

// 创建全局实例
window.expressionEngine = new ExpressionEngine();
