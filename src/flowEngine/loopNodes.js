// DND2 流程引擎 - 循环控制节点和辅助方法
// 原文件: src/flowEngine/FlowEngine.js 第1696-2152行
// Phase 4 拆分: 文件 4/4
//
// 包含：
// 辅助方法：
// - resolvePrimaryKeyValue - 解析主键值
// - resolveVariableValue - 解析变量值
// - evaluateCondition - 计算条件
// - evaluateSimpleExpression - 计算简单表达式
//
// 循环控制节点：
// - executeLoopStartNode - 循环开始节点
// - executeLoopEndNode - 循环结束节点
// - executeContinueNode - 继续节点
// - executeBreakNode - 中断节点
// - findLoopEndNextNode - 查找循环结束后的下一节点
// - findLoopStartNode - 查找循环开始节点

(function() {
  const proto = FlowEngine.prototype;


  // ========== 辅助方法 ==========

  // 解析主键值
proto.resolvePrimaryKeyValue = function(primaryKeyConfig) {
  if (!primaryKeyConfig) return null;
  
  if (primaryKeyConfig.mode === 'static') {
    return primaryKeyConfig.staticValue;
  }
  
  // 动态值
  const dynConfig = primaryKeyConfig.dynamicValue || {};
  if (primaryKeyConfig.dynamicType === 'variable') {
    return this.resolveVariableValue(dynConfig.variable);
  } else if (primaryKeyConfig.dynamicType === 'urlParam') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(dynConfig.urlParam);
  }
  
  return null;
}

  // 解析变量值（支持点号路径，如 user.name）
proto.resolveVariableValue = function(path) {
  if (!path) return undefined;
  
  const parts = path.split('.');
  let value = this.variables;
  
  for (let i = 0; i < parts.length; i++) {
    let part = parts[i];
    
    if (value && typeof value === 'object') {
      // 直接查找
      if (part in value) {
        value = value[part];
      } else {
        // 如果直接查找失败，尝试将字段名称转换为字段ID
        const fieldId = this.fieldNameToId ? this.fieldNameToId[part] : null;
        if (fieldId && fieldId in value) {
          value = value[fieldId];
        } else {
          // 还是找不到，返回 undefined
          console.log(`resolveVariableValue: 找不到路径 "${part}"，尝试转换后的字段ID "${fieldId}" 也不存在`);
          return undefined;
        }
      }
    } else {
      return undefined;
    }
  }
  
  return value;
}

  // 根据字段名称查找字段ID（备用方法）
proto.findFieldIdByName = function(obj, fieldName) {
  // 优先使用预加载的映射
  if (this.fieldNameToId && this.fieldNameToId[fieldName]) {
    return this.fieldNameToId[fieldName];
  }
  return null;
}

  // 获取字段定义（从缓存中）
proto.getFieldDefinition = function(fieldId) {
  if (this.fieldIdToName && this.fieldIdToName[fieldId]) {
    return { id: fieldId, name: this.fieldIdToName[fieldId] };
  }
  return null;
}

  // 解析系统值
proto.resolveSystemValue = function(systemVar) {
  switch (systemVar) {
    case '@NOW':
      return new Date().toISOString();
    case '@TODAY':
      return new Date().toISOString().split('T')[0];
    case '@USER':
      return 'current_user';  // TODO: 实际用户ID
    case '@USERNAME':
      return '当前用户';  // TODO: 实际用户名
    default:
      return systemVar;
  }
}

  // 替换字符串中的变量 {变量名}
proto.replaceVariables = function(str) {
  return str.replace(/\{([^}]+)\}/g, (match, varPath) => {
    const value = this.resolveVariableValue(varPath);
    return value !== undefined ? String(value) : match;
  });
}

  // 计算表达式
proto.evaluateExpression = function(expression) {
  if (!expression) return null;
  
  // 替换变量引用
  let expr = expression;
  
  // 匹配变量名（如 user.name, order.金额）
  const varPattern = /([a-zA-Z_\u4e00-\u9fa5][a-zA-Z0-9_\u4e00-\u9fa5]*(?:\.[a-zA-Z_\u4e00-\u9fa5][a-zA-Z0-9_\u4e00-\u9fa5]*)*)/g;
  
  expr = expr.replace(varPattern, (match) => {
    // 跳过纯数字和保留字
    if (/^\d+$/.test(match) || ['true', 'false', 'null', 'undefined'].includes(match)) {
      return match;
    }
    
    const value = this.resolveVariableValue(match);
    if (value === undefined) {
      return match;  // 保持原样
    }
    
    if (typeof value === 'string') {
      return `"${value}"`;
    }
    return JSON.stringify(value);
  });
  
  console.log('表达式计算:', expression, '->', expr);
  
  try {
    // 安全地执行表达式（简单实现，生产环境需要更安全的方式）
    return new Function(`return ${expr}`)();
  } catch (error) {
    console.error('表达式计算错误:', error);
    return null;
  }
}

  // ========== 循环控制节点执行 ==========

  // 执行循环开始节点
proto.executeLoopStartNode = async function(node, design) {
  const config = node.config || {};
  
  console.log('');
  console.log('========== 循环开始节点执行 ==========');
  console.log('节点ID:', node.id);
  console.log('循环方式:', config.loopType === 'forEach' ? '遍历对象' : '条件循环');
  
  // 初始化循环上下文（如果不存在）
  if (!this.loopContexts) {
    this.loopContexts = {};
  }
  
  // 检查是否已经在循环中
  const existingContext = this.loopContexts[node.id];
  
  if (config.loopType === 'forEach') {
    // 遍历模式
    const sourceVar = config.forEachConfig?.sourceVar;
    const sourceData = this.variables[sourceVar];
    
    console.log('数据来源变量:', sourceVar);
    console.log('数据内容:', sourceData);
    
    if (!Array.isArray(sourceData)) {
      console.warn('遍历对象不是数组，跳过循环');
      return this.findLoopEndNextNode(node, design);
    }
    
    if (existingContext && existingContext.type === 'forEach') {
      // 继续下一次迭代
      existingContext.index++;
      console.log('继续迭代，当前索引:', existingContext.index);
      
      if (existingContext.index >= sourceData.length) {
        // 遍历完成
        console.log('遍历完成，共处理', sourceData.length, '条数据');
        delete this.loopContexts[node.id];
        return this.findLoopEndNextNode(node, design);
      }
      
      // 设置当前项和索引变量
      const itemVar = config.forEachConfig?.itemVar || 'item';
      const indexVar = config.forEachConfig?.indexVar || 'index';
      this.variables[itemVar] = sourceData[existingContext.index];
      this.variables[indexVar] = existingContext.index;
      
      console.log(`设置变量 $${itemVar} =`, sourceData[existingContext.index]);
      console.log(`设置变量 $${indexVar} =`, existingContext.index);
      
    } else {
      // 首次进入循环
      if (sourceData.length === 0) {
        console.log('数组为空，跳过循环');
        return this.findLoopEndNextNode(node, design);
      }
      
      this.loopContexts[node.id] = {
        type: 'forEach',
        index: 0,
        total: sourceData.length,
        loopEndNodeId: config.loopEndNodeId
      };
      
      // 设置当前项和索引变量
      const itemVar = config.forEachConfig?.itemVar || 'item';
      const indexVar = config.forEachConfig?.indexVar || 'index';
      this.variables[itemVar] = sourceData[0];
      this.variables[indexVar] = 0;
      
      console.log('开始遍历，共', sourceData.length, '条数据');
      console.log(`设置变量 $${itemVar} =`, sourceData[0]);
      console.log(`设置变量 $${indexVar} =`, 0);
    }
    
  } else {
    // 条件循环模式
    if (existingContext && existingContext.type === 'while') {
      // 继续下一次迭代
      existingContext.count++;
      console.log('继续迭代，当前次数:', existingContext.count);
      
      // 检查最大次数
      const maxCount = config.whileConfig?.maxCount || 100;
      if (existingContext.count >= maxCount) {
        console.warn('达到最大循环次数限制:', maxCount);
        delete this.loopContexts[node.id];
        return this.findLoopEndNextNode(node, design);
      }
      
      // 检查条件
      const conditionMet = this.evaluateLoopCondition(config.whileConfig);
      if (!conditionMet) {
        console.log('循环条件不满足，结束循环');
        delete this.loopContexts[node.id];
        return this.findLoopEndNextNode(node, design);
      }
      
      // 设置计数变量
      const countVar = config.whileConfig?.countVar || 'loopCount';
      this.variables[countVar] = existingContext.count;
      
    } else {
      // 首次进入循环
      // 检查条件
      const conditionMet = this.evaluateLoopCondition(config.whileConfig);
      if (!conditionMet) {
        console.log('初始条件不满足，跳过循环');
        return this.findLoopEndNextNode(node, design);
      }
      
      this.loopContexts[node.id] = {
        type: 'while',
        count: 0,
        loopEndNodeId: config.loopEndNodeId
      };
      
      // 设置计数变量
      const countVar = config.whileConfig?.countVar || 'loopCount';
      this.variables[countVar] = 0;
      
      console.log('开始条件循环');
      console.log(`设置变量 $${countVar} =`, 0);
    }
  }
  
  console.log('========================================');
  console.log('');
  
  // 继续执行循环体（下一个节点）
  return this.getNextNodeId(node.id, design);
}

  // 评估循环条件
proto.evaluateLoopCondition = function(whileConfig) {
  if (!whileConfig) return false;
  
  // 获取左值
  let leftValue = this.variables[whileConfig.leftVariableId];
  if (whileConfig.leftVariablePath) {
    leftValue = this.getNestedValue(leftValue, whileConfig.leftVariablePath);
  }
  
  // 获取右值
  let rightValue;
  if (whileConfig.rightType === 'constant') {
    rightValue = whileConfig.rightValue;
  } else {
    rightValue = this.variables[whileConfig.rightVariableId];
    if (whileConfig.rightVariablePath) {
      rightValue = this.getNestedValue(rightValue, whileConfig.rightVariablePath);
    }
  }
  
  // 比较
  return this.compareValues(leftValue, rightValue, whileConfig.operator);
}

  // 获取嵌套值
proto.getNestedValue = function(obj, path) {
  if (!obj || !path) return obj;
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    if (value && typeof value === 'object') {
      value = value[key];
    } else {
      return undefined;
    }
  }
  return value;
}

  // 找到循环结束后的下一个节点
proto.findLoopEndNextNode = function(loopStartNode, design) {
  const config = loopStartNode.config || {};
  
  // 如果配置了循环结束节点ID，找到它后面的节点
  if (config.loopEndNodeId) {
    return this.getNextNodeId(config.loopEndNodeId, design);
  }
  
  // 否则尝试查找与此循环开始节点关联的循环结束节点
  const loopEndNode = design.nodes.find(n => 
    n.type === 'loopEnd' && n.config?.loopStartNodeId === loopStartNode.id
  );
  
  if (loopEndNode) {
    return this.getNextNodeId(loopEndNode.id, design);
  }
  
  // 找不到循环结束节点，直接返回null结束流程
  console.warn('找不到对应的循环结束节点');
  return null;
}

  // 执行循环结束节点
proto.executeLoopEndNode = async function(node, design) {
  const config = node.config || {};
  
  console.log('');
  console.log('========== 循环结束节点执行 ==========');
  console.log('节点ID:', node.id);
  
  // 找到对应的循环开始节点
  const loopStartNodeId = config.loopStartNodeId;
  
  if (!loopStartNodeId) {
    console.warn('未配置对应的循环开始节点');
    return this.getNextNodeId(node.id, design);
  }
  
  // 检查是否有跳出标志
  if (this.loopBreakFlag && this.loopBreakFlag === loopStartNodeId) {
    console.log('检测到跳出标志，结束循环');
    delete this.loopBreakFlag;
    delete this.loopContexts[loopStartNodeId];
    return this.getNextNodeId(node.id, design);
  }
  
  // 获取循环上下文
  const context = this.loopContexts?.[loopStartNodeId];
  
  if (!context) {
    console.log('没有循环上下文，直接继续');
    return this.getNextNodeId(node.id, design);
  }
  
  console.log('循环上下文:', context);
  console.log('跳回循环开始节点:', loopStartNodeId);
  console.log('========================================');
  console.log('');
  
  // 跳回循环开始节点（会在那里判断是否继续）
  return loopStartNodeId;
}

  // 执行跳过节点 (continue)
proto.executeContinueNode = async function(node, design) {
  console.log('');
  console.log('========== 跳过节点执行 ==========');
  console.log('节点ID:', node.id);
  
  // 找到当前所在的循环
  const currentLoopStartId = this.findCurrentLoopStartId(node.id, design);
  
  if (!currentLoopStartId) {
    console.warn('跳过节点不在循环内，忽略');
    return this.getNextNodeId(node.id, design);
  }
  
  console.log('跳过当前迭代，跳转到循环结束节点');
  
  // 找到对应的循环结束节点
  const loopEndNode = design.nodes.find(n => 
    n.type === 'loopEnd' && n.config?.loopStartNodeId === currentLoopStartId
  );
  
  if (loopEndNode) {
    console.log('跳转到:', loopEndNode.id);
    console.log('========================================');
    return loopEndNode.id;
  }
  
  // 找不到循环结束节点，继续执行
  console.warn('找不到对应的循环结束节点');
  console.log('========================================');
  return this.getNextNodeId(node.id, design);
}

  // 执行跳出节点 (break)
proto.executeBreakNode = async function(node, design) {
  console.log('');
  console.log('========== 跳出节点执行 ==========');
  console.log('节点ID:', node.id);
  
  // 找到当前所在的循环
  const currentLoopStartId = this.findCurrentLoopStartId(node.id, design);
  
  if (!currentLoopStartId) {
    console.warn('跳出节点不在循环内，忽略');
    return this.getNextNodeId(node.id, design);
  }
  
  console.log('设置跳出标志，结束循环');
  
  // 设置跳出标志
  this.loopBreakFlag = currentLoopStartId;
  
  // 找到对应的循环结束节点
  const loopEndNode = design.nodes.find(n => 
    n.type === 'loopEnd' && n.config?.loopStartNodeId === currentLoopStartId
  );
  
  if (loopEndNode) {
    console.log('跳转到循环结束:', loopEndNode.id);
    console.log('========================================');
    return loopEndNode.id;
  }
  
  // 找不到循环结束节点
  console.warn('找不到对应的循环结束节点');
  console.log('========================================');
  return null;
}

  // 查找当前节点所在的循环开始节点ID
proto.findCurrentLoopStartId = function(nodeId, design) {
  // 简单实现：检查loopContexts中活跃的循环
  if (this.loopContexts) {
    const activeLoops = Object.keys(this.loopContexts);
    if (activeLoops.length > 0) {
      // 返回最近的活跃循环
      return activeLoops[activeLoops.length - 1];
    }
  }
  return null;
}
}

  console.log('[DND2] flowEngine/loopNodes.js 加载完成 - 循环控制节点和辅助方法已注册');
})();
