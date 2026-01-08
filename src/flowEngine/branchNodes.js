// DND2 流程引擎 - 分支和计算节点
// 原文件: src/flowEngine/FlowEngine.js 第1071-1695行
// Phase 4 拆分: 文件 3/4
//
// 包含：
// - executeBinaryBranchNode - 二元分支节点
// - executeExistCheckNode - 存在性检查节点
// - executeAlertNode - 提示节点
// - executeJumpNode - 跳转节点
// - executeCalculateNode - 计算节点
// - executeAggregateNode - 聚合节点

(function() {
  const proto = FlowEngine.prototype;

  // 执行是非分叉节点
proto.executeBinaryBranchNode = async function(node, design) {
  const config = node.config || {};
  
  console.log('');
  console.log('========== 是非分叉节点执行 ==========');
  console.log('节点ID:', node.id);
  console.log('节点名称:', node.name || '(未命名)');
  console.log('完整配置:', JSON.stringify(config, null, 2));
  
  let condition = false;
  
  // 根据判断模式计算条件
  if (config.conditionMode === 'expression') {
    // 表达式模式（高级）
    console.log('【判断模式】表达式模式');
    condition = this.evaluateExpression(config.condition);
  } else {
    // 变量比较模式（默认）
    console.log('【判断模式】变量比较模式');
    condition = this.evaluateCompareCondition(config);
  }
  
  console.log('');
  console.log('【4. 分叉决策】');
  console.log('判断结果:', condition ? '是 (true)' : '否 (false)');
  
  // 根据条件选择分支
  // 优先使用配置中的目标，如果没有则通过连线查找
  let targetNodeId = null;
  let targetSource = '';
  
  if (condition) {
    // 条件为真
    if (config.trueAction?.target) {
      targetNodeId = config.trueAction.target;
      targetSource = '配置中的 trueAction.target';
    } else {
      // 查找标记为 true 的连线
      const edges = design.edges || design.connections || [];
      console.log('查找 true 连线，所有连线:', edges.filter(e => e.from === node.id));
      const trueEdge = edges.find(e => e.from === node.id && e.label === 'true');
      if (trueEdge) {
        targetNodeId = trueEdge.to;
        targetSource = '连线 (label=true)';
      } else {
        targetNodeId = this.getNextNodeId(node.id, design);
        targetSource = '默认下一个节点';
      }
    }
  } else {
    // 条件为假
    if (config.falseAction?.target) {
      targetNodeId = config.falseAction.target;
      targetSource = '配置中的 falseAction.target';
    } else {
      // 查找标记为 false 的连线
      const edges = design.edges || design.connections || [];
      console.log('查找 false 连线，所有连线:', edges.filter(e => e.from === node.id));
      const falseEdge = edges.find(e => e.from === node.id && e.label === 'false');
      if (falseEdge) {
        targetNodeId = falseEdge.to;
        targetSource = '连线 (label=false)';
      } else {
        targetNodeId = null;
        targetSource = '无匹配连线，流程可能终止';
      }
    }
  }
  
  console.log('目标节点ID:', targetNodeId);
  console.log('目标来源:', targetSource);
  console.log('========================================');
  console.log('');
  
  return targetNodeId;
}

  // 执行存在性校验节点
proto.executeExistCheckNode = async function(node, design) {
  const config = node.config || {};
  
  console.log('');
  console.log('========== 存在性校验节点执行 ==========');
  console.log('节点ID:', node.id);
  console.log('节点名称:', node.name || '(未命名)');
  console.log('完整配置:', JSON.stringify(config, null, 2));
  
  // 获取校验对象变量
  const sourceVariableId = config.sourceVariableId;
  const sourceData = this.variables[sourceVariableId];
  
  console.log('');
  console.log('【1. 校验对象】');
  console.log('变量ID:', sourceVariableId);
  console.log('变量值:', sourceData);
  console.log('变量类型:', typeof sourceData);
  
  if (!sourceData) {
    console.log('警告: 校验对象变量为空');
    // 变量为空视为不存在
    return this.getExistCheckNextNode(node, design, false);
  }
  
  // 获取目标表单数据
  const targetFormId = config.targetFormId;
  console.log('');
  console.log('【2. 目标表单】');
  console.log('表单ID:', targetFormId);
  
  if (!targetFormId) {
    console.log('警告: 未配置目标表单');
    return this.getExistCheckNextNode(node, design, false);
  }
  
  const targetForm = this.forms.find(f => f.id === targetFormId);
  if (!targetForm) {
    console.log('警告: 目标表单不存在');
    return this.getExistCheckNextNode(node, design, false);
  }
  
  const formData = targetForm.data || [];
  console.log('表单名称:', targetForm.name);
  console.log('表单数据条数:', formData.length);
  
  // 获取匹配规则
  const matchRules = config.matchRules || [];
  console.log('');
  console.log('【3. 匹配规则】');
  console.log('规则数量:', matchRules.length);
  
  if (matchRules.length === 0) {
    console.log('警告: 未配置匹配规则');
    return this.getExistCheckNextNode(node, design, false);
  }
  
  // 执行存在性检查
  let exists = false;
  
  for (const record of formData) {
    let allMatch = true;
    
    for (const rule of matchRules) {
      // 获取校验对象的字段值
      let sourceValue;
      if (typeof sourceData === 'object' && sourceData !== null) {
        sourceValue = sourceData[rule.sourceField];
      } else {
        sourceValue = sourceData;
      }
      
      // 获取目标表单记录的字段值
      const targetValue = record[rule.targetField];
      
      // 比较
      const match = this.compareValues(sourceValue, targetValue, rule.operator || '==');
      
      console.log(`  规则: ${rule.sourceField} ${rule.operator || '=='} ${rule.targetField}`);
      console.log(`    源值: ${sourceValue}, 目标值: ${targetValue}, 匹配: ${match}`);
      
      if (!match) {
        allMatch = false;
        break;
      }
    }
    
    if (allMatch) {
      exists = true;
      console.log('  找到匹配记录:', record);
      break;
    }
  }
  
  console.log('');
  console.log('【4. 校验结果】');
  console.log('存在:', exists ? '是' : '否');
  console.log('========================================');
  console.log('');
  
  return this.getExistCheckNextNode(node, design, exists);
}

  // 获取存在性校验的下一个节点
  proto.getExistCheckNextNode = function(node, design, exists) {
    const edges = design.edges || design.connections || [];
    const nodeEdges = edges.filter(e => e.from === node.id);

    console.log('查找分支连线:', nodeEdges);
  
  if (exists) {
    // 存在 - 走 yes 分支
    const yesEdge = nodeEdges.find(e => e.fromOutput === 'yes');
    if (yesEdge) {
      console.log('走 yes 分支，目标节点:', yesEdge.to);
      return yesEdge.to;
    }
  } else {
    // 不存在 - 走 no 分支
    const noEdge = nodeEdges.find(e => e.fromOutput === 'no');
    if (noEdge) {
      console.log('走 no 分支，目标节点:', noEdge.to);
      return noEdge.to;
    }
  }
  
  // 如果没有找到对应分支，尝试默认连线
  const defaultEdge = nodeEdges.find(e => !e.fromOutput || e.fromOutput === 'default');
  if (defaultEdge) {
    console.log('走默认分支，目标节点:', defaultEdge.to);
    return defaultEdge.to;
  }
  
  console.log('未找到匹配的连线');
  return null;
}

  // 比较两个值
  proto.compareValues = function(left, right, operator) {
  // 类型转换，尝试数字比较
  const leftNum = parseFloat(left);
  const rightNum = parseFloat(right);
  const useNumeric = !isNaN(leftNum) && !isNaN(rightNum);
  
  const l = useNumeric ? leftNum : String(left);
  const r = useNumeric ? rightNum : String(right);
  
  switch (operator) {
    case '==':
    case '===':
      return l == r;
    case '!=':
    case '!==':
      return l != r;
    case '>':
      return l > r;
    case '>=':
      return l >= r;
    case '<':
      return l < r;
    case '<=':
      return l <= r;
    default:
      return l == r;
  }
}

  // 计算变量比较条件
  proto.evaluateCompareCondition = function(config) {
  console.log('');
  console.log('【1. 获取左侧变量值】');
  console.log('左侧变量ID:', config.leftVariableId);
  console.log('左侧字段路径:', config.leftVariablePath || '(无)');
  
  // 获取左值
  let leftValue;
  let leftRawValue;
  if (config.leftVariableId) {
    // 先获取原始变量值
    leftRawValue = this.variables[config.leftVariableId];
    console.log('变量原始值:', leftRawValue);
    console.log('变量原始类型:', typeof leftRawValue);
    if (typeof leftRawValue === 'object' && leftRawValue !== null) {
      console.log('变量原始值(JSON):', JSON.stringify(leftRawValue, null, 2));
    }
    
    // 解析路径
    const leftPath = config.leftVariablePath 
      ? `${config.leftVariableId}.${config.leftVariablePath}` 
      : config.leftVariableId;
    console.log('完整解析路径:', leftPath);
    leftValue = this.resolveVariableValue(leftPath);
    console.log('解析后的值:', leftValue);
    console.log('解析后的类型:', typeof leftValue);
  } else {
    console.log('警告: 未配置左侧变量ID');
  }
  
  console.log('');
  console.log('【2. 获取右侧比较值】');
  console.log('右值类型:', config.rightValueType);
  
  // 获取右值
  let rightValue;
  if (config.rightValueType === 'fixed') {
    rightValue = config.rightFixedValue;
    console.log('固定值(原始):', rightValue, '类型:', typeof rightValue);
    // 尝试转换为数字
    if (rightValue !== '' && !isNaN(Number(rightValue))) {
      rightValue = Number(rightValue);
      console.log('固定值(转换后):', rightValue, '类型:', typeof rightValue);
    }
  } else if (config.rightValueType === 'variable') {
    console.log('右侧变量ID:', config.rightVariableId);
    console.log('右侧字段路径:', config.rightVariablePath || '(无)');
    const rightPath = config.rightVariablePath 
      ? `${config.rightVariableId}.${config.rightVariablePath}` 
      : config.rightVariableId;
    rightValue = this.resolveVariableValue(rightPath);
    console.log('右侧变量解析值:', rightValue);
  } else if (config.rightValueType === 'system') {
    console.log('系统值:', config.rightSystemValue);
    rightValue = this.resolveSystemValue(config.rightSystemValue);
    console.log('系统值解析结果:', rightValue);
  }
  
  const operator = config.operator || '==';
  
  console.log('');
  console.log('【3. 执行比较】');
  console.log('左值:', leftValue, `(${typeof leftValue})`);
  console.log('运算符:', operator);
  console.log('右值:', rightValue, `(${typeof rightValue})`);
  
  // 执行比较
  let result;
  let compareExpression;
  switch (operator) {
    case '==':
      result = leftValue == rightValue;
      compareExpression = `${leftValue} == ${rightValue}`;
      break;
    case '!=':
      result = leftValue != rightValue;
      compareExpression = `${leftValue} != ${rightValue}`;
      break;
    case '>':
      result = Number(leftValue) > Number(rightValue);
      compareExpression = `Number(${leftValue}) > Number(${rightValue}) => ${Number(leftValue)} > ${Number(rightValue)}`;
      break;
    case '>=':
      result = Number(leftValue) >= Number(rightValue);
      compareExpression = `Number(${leftValue}) >= Number(${rightValue}) => ${Number(leftValue)} >= ${Number(rightValue)}`;
      break;
    case '<':
      result = Number(leftValue) < Number(rightValue);
      compareExpression = `Number(${leftValue}) < Number(${rightValue}) => ${Number(leftValue)} < ${Number(rightValue)}`;
      break;
    case '<=':
      result = Number(leftValue) <= Number(rightValue);
      compareExpression = `Number(${leftValue}) <= Number(${rightValue}) => ${Number(leftValue)} <= ${Number(rightValue)}`;
      break;
    case 'contains':
      result = String(leftValue).includes(String(rightValue));
      compareExpression = `"${leftValue}".includes("${rightValue}")`;
      break;
    case 'startsWith':
      result = String(leftValue).startsWith(String(rightValue));
      compareExpression = `"${leftValue}".startsWith("${rightValue}")`;
      break;
    case 'endsWith':
      result = String(leftValue).endsWith(String(rightValue));
      compareExpression = `"${leftValue}".endsWith("${rightValue}")`;
      break;
    default:
      console.warn('未知运算符:', operator);
      result = false;
      compareExpression = `未知运算符: ${operator}`;
  }
  
  console.log('比较表达式:', compareExpression);
  console.log('比较结果:', result);
  
  return result;
}

  // 执行提示节点
proto.executeAlertNode = async function(node, design) {
  const config = node.config || {};
  console.log('提示节点配置:', config);
  
  // 替换变量
  let message = config.message || '';
  message = this.replaceVariables(message);
  
  const alertType = config.alertType || 'info';
  
  if (alertType === 'confirm') {
    // 确认框
    const confirmed = confirm(message);
    if (confirmed) {
      return config.confirmTarget?.nodeId || this.getNextNodeId(node.id, design);
    } else {
      return config.cancelTarget?.nodeId || null;
    }
  } else {
    // 其他提示类型
    alert(message);
  }
  
  return this.getNextNodeId(node.id, design);
}

  // 执行跳转节点
proto.executeJumpNode = async function(node, design) {
  const config = node.config || {};
  console.log('跳转节点配置:', config);
  
  if (config.targetPageId) {
    const urlParams = new URLSearchParams(window.location.search);
    const currentProjectId = urlParams.get('projectId');
    const page = this.pages.find(p => p.id === config.targetPageId);
    
    if (page) {
      let targetUrl = `preview.html?projectId=${currentProjectId}&roleId=${page.roleId}&pageId=${config.targetPageId}`;
      
      // 添加传入参数
      const params = config.params || [];
      for (const param of params) {
        let value;
        if (param.valueType === 'fixed') {
          value = param.value;
        } else {
          value = this.resolveVariableValue(param.value);
        }
        if (value !== undefined) {
          targetUrl += `&${param.name}=${encodeURIComponent(value)}`;
        }
      }
      
      const openMode = config.openMode || 'replace';
      if (openMode === 'newWindow') {
        window.open(targetUrl, '_blank');
      } else if (openMode === 'popup') {
        window.open(targetUrl, '_blank', 'width=800,height=600');
      } else {
        window.location.href = targetUrl;
        return null;  // 跳转后不继续执行
      }
    }
  }
  
  // 如果配置了继续执行
  if (config.continueFlow) {
    return this.getNextNodeId(node.id, design);
  }
  return null;
}

  // 执行计算节点
proto.executeCalculateNode = async function(node, design) {
  const config = node.config || {};
  console.log('');
  console.log('========== 计算节点执行 ==========');
  console.log('节点ID:', node.id);
  console.log('配置:', config);
  
  // 获取输出变量ID
  const outputVarId = config.outputVarId || config.outputVar;
  
  if (!outputVarId) {
    console.warn('计算节点未配置输出变量');
    return this.getNextNodeId(node.id, design);
  }
  
  try {
    let result;
    const expressionType = config.expressionType;
    const expressionConfig = config.expressionConfig || {};
    
    console.log('表达式类型:', expressionType);
    console.log('表达式配置:', expressionConfig);
    console.log('当前变量:', this.variables);
    
    // 根据表达式类型计算
    switch (expressionType) {
      case 'assign':
        result = this.calculateAssign(expressionConfig.assign);
        break;
      case 'addition':
        result = this.calculateAddition(expressionConfig.addition);
        break;
      case 'subtraction':
        result = this.calculateSubtraction(expressionConfig.subtraction);
        break;
      case 'multiplication':
        result = this.calculateMultiplication(expressionConfig.multiplication);
        break;
      case 'division':
        result = this.calculateDivision(expressionConfig.division);
        break;
      case 'concat':
        result = this.calculateConcat(expressionConfig.concat);
        break;
      default:
        // 兼容旧格式
        if (config.expression && typeof config.expression === 'object') {
          result = window.expressionEngine?.evaluateStructured(config.expression, this.variables);
        } else if (config.expression && typeof config.expression === 'string') {
          result = this.evaluateExpression(config.expression);
        }
    }
    
    // 保存结果到变量
    this.variables[outputVarId] = result;
    console.log(`计算结果: $${outputVarId} =`, result);
    console.log('========================================');
    console.log('');
    
  } catch (error) {
    console.error('表达式计算失败:', error);
  }
  
  return this.getNextNodeId(node.id, design);
}

  // 计算-赋值
  proto.calculateAssign = function(cfg) {
  if (!cfg || !cfg.varId) return null;
  let value = this.getVariableValue(cfg.varId);
  if (cfg.path && value && typeof value === 'object') {
    value = value[cfg.path];
  }
  return value;
}

  // 计算-加法
  proto.calculateAddition = function(cfg) {
  if (!cfg) return 0;
  let result = cfg.constant || 0;
  (cfg.terms || []).forEach(term => {
    if (term.varId) {
      const value = Number(this.getVariableValue(term.varId)) || 0;
      result += (term.coefficient || 1) * value;
    }
  });
  return result;
}

  // 计算-减法
  proto.calculateSubtraction = function(cfg) {
  if (!cfg) return 0;
  const minuend = Number(this.getVariableValue(cfg.minuend)) || 0;
  const subtrahend = Number(this.getVariableValue(cfg.subtrahend)) || 0;
  return minuend - subtrahend;
}

  // 计算-乘法
  proto.calculateMultiplication = function(cfg) {
  if (!cfg || !cfg.factors) return 0;
  const validFactors = cfg.factors.filter(f => f);
  if (validFactors.length === 0) return 0;
  
  let result = 1;
  validFactors.forEach(varId => {
    result *= Number(this.getVariableValue(varId)) || 0;
  });
  return result;
}

  // 计算-除法
  proto.calculateDivision = function(cfg) {
  if (!cfg) return 0;
  const dividend = Number(this.getVariableValue(cfg.dividend)) || 0;
  const divisor = Number(this.getVariableValue(cfg.divisor)) || 0;
  if (divisor === 0) return 0;
  return dividend / divisor;
}

  // 计算-文本拼接
  proto.calculateConcat = function(cfg) {
  if (!cfg || !cfg.items) return '';
  let result = '';
  cfg.items.forEach(item => {
    if (item.type === 'constant') {
      result += item.value || '';
    } else if (item.type === 'variable') {
      let value = this.getVariableValue(item.varId);
      if (item.path && value && typeof value === 'object') {
        value = value[item.path];
      }
      result += String(value ?? '');
    }
  });
  return result;
}

  // 获取变量值（支持循环变量）
  proto.getVariableValue = function(varId) {
  if (!varId) return null;
  // 支持带$和不带$的变量ID
  const normalizedId = varId.startsWith('$') ? varId.substring(1) : varId;
  return this.variables[varId] !== undefined ? this.variables[varId] : this.variables[normalizedId];
}

  // 执行聚合节点
proto.executeAggregateNode = async function(node, design) {
  const config = node.config || {};
  console.log('聚合节点配置:', config);
  
  if (config.sourceVar && config.outputVar) {
    const sourceData = this.variables[config.sourceVar];
    
    if (Array.isArray(sourceData)) {
      let result;
      const field = config.field;
      
      switch (config.method) {
        case 'count':
          result = sourceData.length;
          break;
        case 'sum':
          result = sourceData.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0);
          break;
        case 'avg':
          result = sourceData.length > 0 
            ? sourceData.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0) / sourceData.length
            : 0;
          break;
        case 'max':
          result = Math.max(...sourceData.map(item => parseFloat(item[field]) || 0));
          break;
        case 'min':
          result = Math.min(...sourceData.map(item => parseFloat(item[field]) || 0));
          break;
        default:
          result = 0;
      }
      
      this.variables[config.outputVar] = result;
      console.log(`变量 ${config.outputVar} =`, result);
    }
  }
  
  return this.getNextNodeId(node.id, design);
}

  console.log('[DND2] flowEngine/branchNodes.js 加载完成 - 分支计算节点已注册');
})();
