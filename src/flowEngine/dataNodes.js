// DND2 流程引擎 - 数据操作节点
// 原文件: src/flowEngine/FlowEngine.js 第433-1070行
// Phase 4 拆分: 文件 2/4
//
// 包含：
// - executeReadNode - 读取数据节点
// - executeWriteNode - 写入数据节点
// - executeBatchWrite - 批量写入
// - executeSingleWrite - 逐条写入
// - executeCellUpdate - 单元格更新
// - getPrimaryKeyFieldId - 获取主键字段ID
// - getNextPrimaryKeyValue - 获取下一个主键值
// - executeUpdateNode - 更新数据节点
// - executeDeleteNode - 删除数据节点

(function() {
  const proto = FlowEngine.prototype;

  // 执行读取节点
proto.executeReadNode = async function(node, design) {
  const config = node.config || {};
  console.log('读取节点配置:', config);
  
  // 根据sourceType获取formId
  let formId;
  if (config.sourceType === 'form' || !config.sourceType) {
    formId = config.formSource?.formId || config.formId;
  } else if (config.sourceType === 'page') {
    // 从页面读取 - 使用 $INPUT 变量（交互区块输入的数据）
    if (this.variables['$INPUT']) {
      const outputVar = config.outputVar;
      const fieldIds = config.pageSource?.fieldIds || [];  // 多选字段ID列表
      const fieldId = config.pageSource?.fieldId;  // 单选字段ID（兼容旧配置）
      
      console.log('');
      console.log('========== 读取节点（页面输入）==========');
      console.log('节点ID:', node.id);
      console.log('数据来源: 页面输入框 ($INPUT)');
      console.log('$INPUT 原始值:', this.variables['$INPUT']);
      console.log('$INPUT 类型:', typeof this.variables['$INPUT']);
      if (typeof this.variables['$INPUT'] === 'object') {
        console.log('$INPUT 字段:', Object.keys(this.variables['$INPUT'] || {}));
      }
      console.log('配置的提取字段:', fieldIds.length > 0 ? fieldIds : (fieldId || '(未配置，将输出整个对象)'));
      
      if (outputVar) {
        if (typeof this.variables['$INPUT'] === 'object') {
          if (fieldIds.length > 1) {
            // 多选字段：提取多个字段，输出对象
            const extractedData = {};
            for (const fId of fieldIds) {
              extractedData[fId] = this.variables['$INPUT'][fId];
            }
            this.variables[outputVar] = extractedData;
            console.log('提取多个字段值:', extractedData);
          } else if (fieldIds.length === 1 || fieldId) {
            // 单选字段：提取单个字段的值（纯值）
            const singleFieldId = fieldIds[0] || fieldId;
            const extractedValue = this.variables['$INPUT'][singleFieldId];
            this.variables[outputVar] = extractedValue;
            console.log('提取的字段值:', extractedValue, '类型:', typeof extractedValue);
          } else {
            // 没有配置字段，输出整个对象（兼容旧配置）
            this.variables[outputVar] = this.variables['$INPUT'];
            console.log('输出整个对象（未配置字段）');
          }
        } else {
          // $INPUT 不是对象，直接输出
          this.variables[outputVar] = this.variables['$INPUT'];
          console.log('$INPUT 不是对象，直接输出');
        }
        console.log('输出变量:', outputVar);
        console.log('变量值:', this.variables[outputVar]);
      }
      console.log('==========================================');
      console.log('');
      return this.getNextNodeId(node.id, design);
    } else {
      console.log('');
      console.log('========== 读取节点（页面输入）==========');
      console.log('警告: $INPUT 为空，可能交互区块未传递数据');
      console.log('当前所有变量:', Object.keys(this.variables));
      console.log('==========================================');
      console.log('');
      return this.getNextNodeId(node.id, design);
    }
  } else if (config.sourceType === 'input') {
    // 明确指定从输入数据读取
    if (this.variables['$INPUT']) {
      const outputVar = config.outputVar;
      if (outputVar) {
        this.variables[outputVar] = this.variables['$INPUT'];
        console.log('');
        console.log('========== 读取节点（输入数据）==========');
        console.log('$INPUT 值:', this.variables['$INPUT']);
        console.log('输出变量:', outputVar);
        console.log('==========================================');
        console.log('');
      }
      return this.getNextNodeId(node.id, design);
    } else {
      console.log('从输入数据读取：$INPUT 为空');
      return this.getNextNodeId(node.id, design);
    }
  }
  
  if (!formId) {
    throw new Error('读取节点未配置目标表单');
  }
  
  // 获取表单数据
  const form = this.forms.find(f => f.id === formId);
  if (!form) {
    throw new Error(`表单不存在: ${formId}`);
  }
  
  let data = form.data || [];
  console.log('表单原始数据条数:', data.length);
  
  // ===== 应用静态范围条件 =====
  const rangeConditions = config.formSource?.rangeConditions;
  if (rangeConditions) {
    // 1. 指定主键选取
    if (rangeConditions.primaryKeys?.enabled && rangeConditions.primaryKeys.values?.length > 0) {
      const pkField = form.structure?.primaryKey || 'id';
      const pkValues = rangeConditions.primaryKeys.values;
      data = data.filter(d => pkValues.includes(d[pkField]));
      console.log('指定主键筛选后:', data.length, '条');
    }
    
    // 2. 离散属性选取
    if (rangeConditions.discreteAttr?.enabled && rangeConditions.discreteAttr.selectedPaths?.length > 0) {
      const selectedPaths = rangeConditions.discreteAttr.selectedPaths;
      data = data.filter(record => {
        // 记录只要匹配任意一条路径即可
        return selectedPaths.some(path => {
          // 路径的所有层级都要匹配
          return path.levels.every(level => {
            return record[level.fieldId] === level.value;
          });
        });
      });
      console.log('离散属性筛选后:', data.length, '条');
    }
    
    // 3. 连续变量选取
    if (rangeConditions.continuous?.enabled && rangeConditions.continuous.fieldId) {
      const fieldId = rangeConditions.continuous.fieldId;
      const segments = rangeConditions.continuous.segments || [];
      const selectedSegments = segments.filter(s => s.selected);
      
      if (selectedSegments.length > 0) {
        data = data.filter(record => {
          const value = parseFloat(record[fieldId]) || 0;
          // 值落在任意一个选中的分段内即可
          return selectedSegments.some(seg => {
            return value >= seg.min && value < seg.max;
          });
        });
        console.log('连续变量筛选后:', data.length, '条');
      }
    }
  }
  
  // ===== 应用旧的筛选条件（兼容） =====
  const conditions = config.formSource?.conditions || config.conditions || [];
  for (const cond of conditions) {
    data = data.filter(record => {
      const fieldValue = record[cond.field];
      const condValue = cond.valueType === 'variable' 
        ? this.resolveVariableValue(cond.value)
        : cond.value;
      
      switch (cond.operator) {
        case '=': return fieldValue == condValue;
        case '!=': return fieldValue != condValue;
        case '>': return fieldValue > condValue;
        case '>=': return fieldValue >= condValue;
        case '<': return fieldValue < condValue;
        case '<=': return fieldValue <= condValue;
        case 'contains': return String(fieldValue).includes(String(condValue));
        default: return true;
      }
    });
  }
  
  console.log('范围筛选完成，数据条数:', data.length);
  
  // ===== 选取字段（横向筛选） =====
  const selectedFields = config.formSource?.selectedFields;
  if (selectedFields && selectedFields.length > 0) {
    const fieldIds = selectedFields.map(f => f.fieldId);
    const pkField = form.structure?.primaryKey || 'id';
    // 确保主键字段也包含
    if (!fieldIds.includes(pkField)) {
      fieldIds.unshift(pkField);
    }
    data = data.map(record => {
      const filtered = {};
      for (const fid of fieldIds) {
        filtered[fid] = record[fid];
      }
      return filtered;
    });
    console.log('字段筛选，保留字段:', fieldIds);
  }
  
  // 获取读取模式（新版使用 batch/loop/cell，兼容旧版 all/single/cell）
  let readMode = config.formSource?.readMode || config.readMode || 'all';
  // 兼容映射
  if (readMode === 'all') readMode = 'batch';
  if (readMode === 'single') readMode = 'batch';  // 旧的single现在也是batch，主键筛选在rangeConditions处理
  
  const outputVar = config.outputVar;
  
  console.log('读取模式:', readMode, '输出变量:', outputVar);
  
  // 根据读取模式处理
  if (readMode === 'cell') {
    // 读取单元 - 动态主键 + 目标字段
    const cellConfig = config.formSource?.cellConfig;
    let pkValue;
    
    if (cellConfig?.primaryKeyVariable) {
      // 从变量获取主键值
      pkValue = this.variables[cellConfig.primaryKeyVariable];
      // 如果是对象，尝试取主键字段
      if (typeof pkValue === 'object' && pkValue !== null) {
        const pkField = form.structure?.primaryKey || 'id';
        pkValue = pkValue[pkField];
      }
    } else {
      // 兼容旧配置
      const primaryKeyConfig = config.formSource?.primaryKey || config.primaryKey;
      pkValue = this.resolvePrimaryKeyValue(primaryKeyConfig);
    }
    
    const primaryKeyField = form.structure?.primaryKey || 'id';
    const targetFieldId = cellConfig?.targetFieldId || config.formSource?.cellField || config.cellField;
    
    if (!targetFieldId) {
      throw new Error('读取单元：未配置目标字段');
    }
    
    // 在范围内查找记录
    const record = data.find(d => d[primaryKeyField] == pkValue);
    
    if (record && outputVar) {
      const cellValue = record[targetFieldId];
      this.variables[outputVar] = cellValue;
      console.log(`变量 ${outputVar} = ${cellValue} (单元格值)`);
    } else {
      console.log('未找到匹配记录，主键值:', pkValue, '（在范围内的', data.length, '条中查找）');
    }
  } else if (readMode === 'loop') {
    // 逐条读取 - 将数据存入变量，后续由循环节点处理
    // 应用排序
    const batchConfig = config.formSource?.batchConfig || {};
    const sortField = batchConfig.sortField || config.formSource?.sortField || config.sortField;
    const sortOrder = batchConfig.sortOrder || config.formSource?.sortOrder || config.sortOrder || 'asc';
    if (sortField) {
      data.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (sortOrder === 'desc') {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });
    }
    
    if (outputVar) {
      this.variables[outputVar] = data;
      console.log(`变量 ${outputVar} =`, data, '(逐条读取模式，需配合循环节点使用)');
    }
  } else {
    // 整体读取（batch）
    const batchConfig = config.formSource?.batchConfig || {};
    
    // 应用排序
    const sortField = batchConfig.sortField || config.formSource?.sortField || config.sortField;
    const sortOrder = batchConfig.sortOrder || config.formSource?.sortOrder || config.sortOrder || 'asc';
    if (sortField) {
      data.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (sortOrder === 'desc') {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });
    }
    
    // 应用数量限制
    const maxCount = batchConfig.maxCount || config.formSource?.readCount || config.readCount;
    if (maxCount && maxCount > 0) {
      data = data.slice(0, maxCount);
    }
    
    if (outputVar) {
      this.variables[outputVar] = data;
      console.log(`变量 ${outputVar} =`, data);
    }
  }
  
  return this.getNextNodeId(node.id, design);
}

  // 执行写入节点
proto.executeWriteNode = async function(node, design) {
  const config = node.config || {};
  console.log('');
  console.log('========== 写入节点执行 ==========');
  console.log('节点ID:', node.id);
  console.log('写入节点配置:', config);
  
  if (!config.formId) {
    throw new Error('写入节点未配置目标表单');
  }
  
  const writeMode = config.writeMode || 'single';
  console.log('写入模式:', writeMode);
  
  // ===== 批量写入模式 (batch) =====
  if (writeMode === 'batch' || writeMode === 'direct' || writeMode === 'mapping') {
    await this.executeBatchWrite(config);
  }
  
  // ===== 逐条写入模式 (single) - 新增 =====
  else if (writeMode === 'single') {
    await this.executeSingleWrite(config);
  }
  
  // ===== 单元格更新模式 (cell) =====
  else if (writeMode === 'cell') {
    await this.executeCellUpdate(config);
  }
  
  console.log('========================================');
  console.log('');
  
  return this.getNextNodeId(node.id, design);
}

  // 批量写入
proto.executeBatchWrite = async function(config) {
  const batchConfig = config.batchConfig || {};
  const sourceVarId = batchConfig.sourceVarId || config.sourceVarId;
  
  if (!sourceVarId) {
    console.warn('批量写入未配置源变量，跳过');
    return;
  }
  
  const sourceData = this.variables[sourceVarId];
  if (!sourceData) {
    console.warn('源变量为空，跳过写入');
    return;
  }
  
  const dataArray = Array.isArray(sourceData) ? sourceData : [sourceData];
  console.log(`准备批量写入 ${dataArray.length} 条数据`);
  
  // 获取主键处理方式
  const primaryKeyMode = batchConfig.primaryKeyMode || 'source';
  let nextPkValue = 1;
  
  if (primaryKeyMode === 'auto') {
    // 自动自增：获取当前最大主键值
    nextPkValue = await this.getNextPrimaryKeyValue(config.formId);
  }
  
  // 获取字段映射
  const fieldMappings = batchConfig.fieldMappings || config.fieldMappings || [];
  
  let successCount = 0;
  const baseTime = new Date().getTime();
  
  for (let i = 0; i < dataArray.length; i++) {
    const sourceRecord = dataArray[i];
    try {
      let writeData = {};
      
      if (fieldMappings.length > 0) {
        // 使用字段映射
        for (const mapping of fieldMappings) {
          let value;
          if (mapping.valueType === 'variable') {
            value = sourceRecord[mapping.sourceFieldId];
          } else if (mapping.valueType === 'fixed') {
            value = mapping.fixedValue;
          } else if (mapping.valueType === 'system') {
            value = this.resolveSystemValue(mapping.fixedValue);
          }
          if (mapping.targetFieldId && value !== undefined) {
            writeData[mapping.targetFieldId] = value;
          }
        }
      } else {
        // 整体写入
        writeData = { ...sourceRecord };
        delete writeData.id;
        delete writeData._isTop;
        delete writeData._topAt;
        delete writeData.updatedAt;
      }
      
      // 处理主键
      if (primaryKeyMode === 'auto') {
        const pkFieldId = await this.getPrimaryKeyFieldId(config.formId);
        if (pkFieldId) {
          writeData[pkFieldId] = nextPkValue++;
        }
      }
      
      // 设置createdAt
      writeData.createdAt = sourceRecord.createdAt || new Date(baseTime + i).toISOString();
      
      await window.dndDB.addFormData(this.projectId, config.formId, writeData);
      successCount++;
      console.log('批量写入一条成功:', writeData);
    } catch (error) {
      console.error('批量写入失败:', error);
    }
  }
  
  console.log(`批量写入完成，成功 ${successCount}/${dataArray.length} 条`);
}

  // 逐条写入
proto.executeSingleWrite = async function(config) {
  const singleConfig = config.singleConfig || {};
  const subMode = singleConfig.subMode || 'mapping';
  
  console.log('逐条写入配置:', singleConfig);
  console.log('子模式:', subMode);
  console.log('当前变量:', this.variables);
  
  // 获取下一个主键值
  const nextPkValue = await this.getNextPrimaryKeyValue(config.formId);
  const pkFieldId = await this.getPrimaryKeyFieldId(config.formId);
  
  console.log('主键字段:', pkFieldId, '下一个值:', nextPkValue);
  
  // 构建写入数据
  let writeData = {};
  
  // 设置主键
  if (pkFieldId) {
    writeData[pkFieldId] = nextPkValue;
  }
  
  if (subMode === 'direct') {
    // 整体写入：从源变量复制所有字段
    const sourceVarId = singleConfig.sourceVarId || '$item';
    const sourceData = this.getVariableValue(sourceVarId);
    
    console.log('整体写入，源变量:', sourceVarId, '数据:', sourceData);
    
    if (sourceData && typeof sourceData === 'object') {
      // 复制所有字段（除了系统字段）
      for (const key in sourceData) {
        if (key !== 'id' && key !== '_isTop' && key !== '_topAt' && 
            key !== 'createdAt' && key !== 'updatedAt' && key !== pkFieldId) {
          writeData[key] = sourceData[key];
        }
      }
    }
  } else {
    // 映射写入：根据字段配置设置值
    const fieldValues = singleConfig.fieldValues || [];
    
    for (const fv of fieldValues) {
      if (!fv.targetFieldId) continue;
      
      let value;
      
      switch (fv.valueType) {
        case 'constant':
          value = fv.value;
          break;
        case 'variable':
          value = this.getVariableValue(fv.varId);
          break;
        case 'varPath':
          value = this.getVariablePathValue(fv.varId, fv.varPath);
          break;
        case 'system':
          value = this.resolveSystemValue(fv.value);
          break;
      }
      
      if (value !== undefined) {
        writeData[fv.targetFieldId] = value;
      }
      
      console.log(`字段 ${fv.targetFieldName || fv.targetFieldId}: ${fv.valueType} → ${value}`);
    }
  }
  
  // 设置创建时间
  writeData.createdAt = new Date().toISOString();
  
  console.log('逐条写入数据:', writeData);
  
  try {
    await window.dndDB.addFormData(this.projectId, config.formId, writeData);
    console.log('逐条写入成功');
  } catch (error) {
    console.error('逐条写入失败:', error);
    throw error;
  }
}

  // 单元格更新
proto.executeCellUpdate = async function(config) {
  const cellConfig = config.cellConfig || {};
  
  if (!cellConfig.targetField) {
    throw new Error('单元格更新未配置目标字段');
  }
  
  // 获取主键值
  let primaryKeyValue;
  const pkConfig = cellConfig.primaryKey || {};
  
  if (pkConfig.mode === 'static') {
    primaryKeyValue = pkConfig.staticValue;
  } else {
    const dynamicConfig = pkConfig.dynamicValue || {};
    if (pkConfig.dynamicType === 'variable') {
      primaryKeyValue = this.getVariableValue(dynamicConfig.variable);
    } else if (pkConfig.dynamicType === 'varPath') {
      primaryKeyValue = this.getVariablePathValue(dynamicConfig.variable, dynamicConfig.varPath);
    } else if (pkConfig.dynamicType === 'urlParam') {
      const urlParams = new URLSearchParams(window.location.search);
      primaryKeyValue = urlParams.get(dynamicConfig.urlParam);
    }
  }
  
  if (!primaryKeyValue && primaryKeyValue !== 0) {
    throw new Error('单元格更新：无法获取主键值');
  }
  
  // 获取写入值
  let writeValue;
  switch (cellConfig.valueType) {
    case 'fixed':
      writeValue = cellConfig.value;
      break;
    case 'variable':
      writeValue = this.getVariableValue(cellConfig.varId);
      break;
    case 'varPath':
      writeValue = this.getVariablePathValue(cellConfig.varId, cellConfig.varPath);
      break;
    case 'system':
      writeValue = this.resolveSystemValue(cellConfig.value);
      break;
  }
  
  console.log('单元格更新:', {
    formId: config.formId,
    primaryKey: primaryKeyValue,
    field: cellConfig.targetField,
    value: writeValue
  });
  
  try {
    const allData = await window.dndDB.getFormDataList(this.projectId, config.formId);
    const pkFieldId = await this.getPrimaryKeyFieldId(config.formId);
    
    const targetRecord = allData.find(record => 
      String(record[pkFieldId]) === String(primaryKeyValue)
    );
    
    if (targetRecord) {
      targetRecord[cellConfig.targetField] = writeValue;
      targetRecord.updatedAt = new Date().toISOString();
      
      await window.dndDB.updateFormData(this.projectId, config.formId, targetRecord);
      console.log('单元格更新成功');
    } else {
      console.warn('未找到目标记录:', primaryKeyValue);
    }
  } catch (error) {
    console.error('单元格更新失败:', error);
    throw error;
  }
}

  // 获取表单的主键字段ID
proto.getPrimaryKeyFieldId = async function(formId) {
  const form = this.forms.find(f => f.id === formId);
  if (form && form.structure && form.structure.fields) {
    const pkField = form.structure.fields.find(f => f.isPrimary);
    return pkField?.fieldId || null;
  }
  return null;
}

  // 获取下一个主键值（查询最大值+1）
proto.getNextPrimaryKeyValue = async function(formId) {
  try {
    const allData = await window.dndDB.getFormDataList(this.projectId, formId);
    const pkFieldId = await this.getPrimaryKeyFieldId(formId);
    
    if (!pkFieldId || allData.length === 0) {
      return 1;
    }
    
    const maxValue = Math.max(...allData.map(record => {
      const val = record[pkFieldId];
      return typeof val === 'number' ? val : parseInt(val) || 0;
    }));
    
    return maxValue + 1;
  } catch (error) {
    console.error('获取最大主键值失败:', error);
    return 1;
  }

  // 获取变量路径值（如 $item.F001）
  getVariablePathValue(varId, path) {
  if (!varId) return undefined;
  
  let value = this.getVariableValue(varId);
  
  if (path && value && typeof value === 'object') {
    value = value[path];
  }
  
  return value;
}

  // 执行更新节点
proto.executeUpdateNode = async function(node, design) {
  const config = node.config || {};
  console.log('更新节点配置:', config);
  
  // TODO: 实现更新逻辑
  
  return this.getNextNodeId(node.id, design);
}

  // 执行删除节点
proto.executeDeleteNode = async function(node, design) {
  const config = node.config || {};
  console.log('删除节点配置:', config);
  
  // TODO: 实现删除逻辑
  
  return this.getNextNodeId(node.id, design);
}


  console.log('[DND2] flowEngine/dataNodes.js 加载完成 - 数据操作节点已注册');
})();
