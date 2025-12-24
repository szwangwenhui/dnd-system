// 数据流程执行引擎
// 负责监听按钮点击事件，查找并执行关联的数据流程

class FlowEngine {
  constructor() {
    this.projectId = null;
    this.dataFlows = [];
    this.forms = [];
    this.pages = [];
    this.variables = {};  // 流程变量存储
    this.currentFlow = null;
    this.isRunning = false;
    
    // 绑定事件监听
    this.handleButtonClick = this.handleButtonClick.bind(this);
  }

  // 初始化引擎
  async init(projectId) {
    this.projectId = projectId;
    
    try {
      // 加载项目数据
      const project = await window.dndDB.getProjectById(projectId);
      if (!project) {
        console.error('FlowEngine: 项目不存在');
        return;
      }
      
      this.dataFlows = project.dataFlows || [];
      
      // 加载表单定义和数据
      await this.loadFormsWithData(projectId, project.forms || []);
      
      // 加载字段列表（用于字段名称到ID的转换）
      await this.loadFields(projectId, project.roles || []);
      
      // 加载所有页面
      this.pages = [];
      for (const role of (project.roles || [])) {
        const rolePages = await window.dndDB.getPagesByRoleId(projectId, role.id);
        this.pages.push(...rolePages);
      }
      
      console.log('FlowEngine 初始化完成:', {
        projectId,
        flowCount: this.dataFlows.length,
        formCount: this.forms.length,
        fieldCount: Object.keys(this.fieldNameToId).length,
        pageCount: this.pages.length
      });
      
      // 开始监听按钮点击事件
      window.addEventListener('buttonClick', this.handleButtonClick);
      
    } catch (error) {
      console.error('FlowEngine 初始化失败:', error);
    }
  }

  // 加载字段列表
  async loadFields(projectId, roles) {
    this.fieldNameToId = {};  // 字段名称 -> 字段ID 的映射
    this.fieldIdToName = {};  // 字段ID -> 字段名称 的映射
    
    try {
      // 使用正确的方法获取项目的所有字段
      const fields = await window.dndDB.getFieldsByProjectId(projectId);
      for (const field of (fields || [])) {
        if (field.name && field.id) {
          this.fieldNameToId[field.name] = field.id;
          this.fieldIdToName[field.id] = field.name;
        }
      }
      
      console.log('FlowEngine: 字段映射加载完成', {
        count: Object.keys(this.fieldNameToId).length,
        nameToId: this.fieldNameToId
      });
    } catch (error) {
      console.warn('加载字段失败:', error);
    }
  }

  // 加载表单定义和数据
  async loadFormsWithData(projectId, formDefinitions) {
    this.forms = [];
    
    for (const formDef of formDefinitions) {
      try {
        // 获取表单数据 - 使用正确的方法名 getFormDataList
        const formData = await window.dndDB.getFormDataList(projectId, formDef.id);
        
        this.forms.push({
          ...formDef,
          data: formData || []
        });
      } catch (error) {
        console.warn(`加载表单 ${formDef.id} 数据失败:`, error);
        this.forms.push({
          ...formDef,
          data: []
        });
      }
    }
    
    console.log('FlowEngine: 表单数据加载完成', this.forms.map(f => ({
      id: f.id,
      name: f.name,
      recordCount: f.data?.length || 0
    })));
  }

  // 销毁引擎
  destroy() {
    window.removeEventListener('buttonClick', this.handleButtonClick);
    this.projectId = null;
    this.dataFlows = [];
    this.forms = [];
    this.pages = [];
    this.variables = {};
    console.log('FlowEngine 已销毁');
  }

  // 处理按钮点击事件
  async handleButtonClick(event) {
    const { blockId, pageId, projectId, inputData, inputFormId } = event.detail;
    
    console.log('FlowEngine 收到按钮点击:', { blockId, pageId, projectId, inputData, inputFormId });
    
    // 查找关联此按钮的数据流程
    const flow = this.findFlowByButton(pageId, blockId);
    
    if (!flow) {
      console.log('FlowEngine: 未找到关联的数据流程');
      return;
    }
    
    console.log('FlowEngine: 找到关联流程:', flow.name, flow.id);
    
    // 执行流程，传递输入数据
    await this.executeFlow(flow, { inputData, inputFormId });
  }

  // 查找关联按钮的数据流程
  findFlowByButton(pageId, blockId) {
    console.log('findFlowByButton 查找:', { pageId, blockId });
    for (const flow of this.dataFlows) {
      if (!flow.design || !flow.design.nodes) continue;
      
      // 查找开始节点
      const startNode = flow.design.nodes.find(n => n.type === 'start');
      if (!startNode || !startNode.config) continue;
      
      const config = startNode.config;
      console.log('检查流程:', flow.name, '开始节点配置:', {
        triggerType: config.triggerType,
        buttonConfig: config.buttonConfig
      });
      
      // 检查是否是按钮触发且匹配
      if (config.triggerType === 'button' && 
          config.buttonConfig?.pageId === pageId && 
          config.buttonConfig?.blockId === blockId) {
        console.log('找到匹配的流程!');
        return flow;
      }
    }
    console.log('未找到匹配的流程');
    return null;
  }

  // 执行数据流程
  async executeFlow(flow, context = {}) {
    if (this.isRunning) {
      console.warn('FlowEngine: 流程正在执行中');
      return;
    }
    
    this.isRunning = true;
    this.currentFlow = flow;
    this.variables = {};  // 重置变量
    
    // 如果有输入数据（来自交互区块），自动创建一个特殊变量
    if (context.inputData) {
      this.variables['$INPUT'] = context.inputData;
      this.variables['$INPUT_FORM_ID'] = context.inputFormId;
      console.log('FlowEngine: 设置输入数据变量 $INPUT =', context.inputData);
    }
    
    console.log('========== 开始执行流程:', flow.name, '==========');
    console.log('流程设计数据:', flow.design);
    
    try {
      // 重新加载最新的表单数据（确保读取到最新状态）
      const project = await window.dndDB.getProjectById(this.projectId);
      if (project) {
        await this.loadFormsWithData(this.projectId, project.forms || []);
      }
      
      const design = flow.design;
      if (!design || !design.nodes) {
        throw new Error('流程设计数据不完整：缺少节点');
      }
      
      // 连线字段可能是 edges 或 connections
      if (!design.edges && !design.connections) {
        design.edges = [];  // 允许没有连线（单节点流程）
      }
      
      // 统一使用 edges
      if (design.connections && !design.edges) {
        design.edges = design.connections;
      }
      
      // 找到开始节点
      const startNode = design.nodes.find(n => n.type === 'start');
      if (!startNode) {
        throw new Error('未找到开始节点');
      }
      
      // 从开始节点开始执行
      await this.executeNode(startNode, design);
      
      console.log('========== 流程执行完成 ==========');
      
    } catch (error) {
      console.error('流程执行失败:', error);
      alert('流程执行失败: ' + error.message);
    } finally {
      this.isRunning = false;
      this.currentFlow = null;
    }
  }

  // 执行单个节点
  async executeNode(node, design) {
    console.log(`执行节点: [${node.type}] ${node.name}`, node.config);
    
    let nextNodeId = null;
    
    switch (node.type) {
      case 'start':
        nextNodeId = await this.executeStartNode(node, design);
        break;
        
      case 'end':
        await this.executeEndNode(node, design);
        return;  // 结束节点不继续
        
      case 'read':
        nextNodeId = await this.executeReadNode(node, design);
        break;
        
      case 'write':
        nextNodeId = await this.executeWriteNode(node, design);
        break;
        
      case 'update':
        nextNodeId = await this.executeUpdateNode(node, design);
        break;
        
      case 'delete':
        nextNodeId = await this.executeDeleteNode(node, design);
        break;
        
      case 'binaryBranch':
        nextNodeId = await this.executeBinaryBranchNode(node, design);
        break;
        
      case 'alert':
      case 'prompt':
        nextNodeId = await this.executeAlertNode(node, design);
        break;
        
      case 'jump':
      case 'pageJump':
        nextNodeId = await this.executeJumpNode(node, design);
        break;
        
      case 'calculate':
        nextNodeId = await this.executeCalculateNode(node, design);
        break;
        
      case 'aggregate':
        nextNodeId = await this.executeAggregateNode(node, design);
        break;
        
      case 'existCheck':
        nextNodeId = await this.executeExistCheckNode(node, design);
        break;
        
      case 'loopStart':
        nextNodeId = await this.executeLoopStartNode(node, design);
        break;
        
      case 'loopEnd':
        nextNodeId = await this.executeLoopEndNode(node, design);
        break;
        
      case 'continue':
        nextNodeId = await this.executeContinueNode(node, design);
        break;
        
      case 'break':
        nextNodeId = await this.executeBreakNode(node, design);
        break;
        
      default:
        console.warn('未实现的节点类型:', node.type);
        nextNodeId = this.getNextNodeId(node.id, design);
    }
    
    // 继续执行下一个节点
    if (nextNodeId) {
      const nextNode = design.nodes.find(n => n.id === nextNodeId);
      if (nextNode) {
        await this.executeNode(nextNode, design);
      }
    }
  }

  // 获取下一个节点ID（通过连线）
  getNextNodeId(currentNodeId, design) {
    const edges = design.edges || design.connections || [];
    const edge = edges.find(e => e.from === currentNodeId);
    return edge ? edge.to : null;
  }

  // 执行开始节点
  async executeStartNode(node, design) {
    console.log('开始节点，触发类型:', node.config?.triggerType);
    return this.getNextNodeId(node.id, design);
  }

  // 执行结束节点
  async executeEndNode(node, design) {
    const config = node.config || {};
    console.log('结束节点，配置:', config);
    
    // 根据endType处理不同的结束行为
    const endType = config.endType || 'silent';
    
    switch (endType) {
      case 'alert':
        // 显示提示
        const alertConfig = config.alertConfig || {};
        if (alertConfig.message) {
          alert(alertConfig.message);
        }
        break;
        
      case 'jump':
        // 跳转到页面
        const jumpConfig = config.jumpConfig || {};
        if (jumpConfig.pageId) {
          console.log('跳转到页面:', jumpConfig.pageId);
          
          const page = this.pages.find(p => p.id === jumpConfig.pageId);
          if (page) {
            const urlParams = new URLSearchParams(window.location.search);
            const currentProjectId = urlParams.get('projectId');
            const currentRoleId = urlParams.get('roleId');
            
            // 构建目标URL
            let targetUrl = `preview.html?projectId=${currentProjectId}&roleId=${page.roleId || currentRoleId}&pageId=${jumpConfig.pageId}`;
            
            // 添加参数
            const params = jumpConfig.params || [];
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
            
            // 根据打开方式执行跳转
            const openMode = jumpConfig.openMode || 'replace';
            if (openMode === 'newWindow') {
              window.open(targetUrl, '_blank');
            } else if (openMode === 'popup') {
              window.open(targetUrl, '_blank', 'width=800,height=600');
            } else {
              // replace - 替换当前页
              window.location.href = targetUrl;
            }
          }
        }
        break;
        
      case 'back':
        // 返回上一页
        const backConfig = config.backConfig || {};
        if (backConfig.refresh) {
          // 带刷新返回
          window.history.back();
          setTimeout(() => window.location.reload(), 100);
        } else {
          window.history.back();
        }
        break;
        
      case 'refresh':
        // 刷新当前页
        const refreshConfig = config.refreshConfig || {};
        if (refreshConfig.message) {
          alert(refreshConfig.message);
        }
        window.location.reload();
        break;
        
      case 'closePopup':
        // 关闭弹窗
        const closePopupConfig = config.closePopupConfig || {};
        if (closePopupConfig.refreshParent && window.opener) {
          window.opener.location.reload();
        }
        window.close();
        break;
        
      case 'silent':
      default:
        // 静默结束，不做任何操作
        break;
    }
  }

  // 执行读取节点
  async executeReadNode(node, design) {
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
  async executeWriteNode(node, design) {
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
  async executeBatchWrite(config) {
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
  async executeSingleWrite(config) {
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
  async executeCellUpdate(config) {
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
  async getPrimaryKeyFieldId(formId) {
    const form = this.forms.find(f => f.id === formId);
    if (form && form.structure && form.structure.fields) {
      const pkField = form.structure.fields.find(f => f.isPrimary);
      return pkField?.fieldId || null;
    }
    return null;
  }

  // 获取下一个主键值（查询最大值+1）
  async getNextPrimaryKeyValue(formId) {
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
  async executeUpdateNode(node, design) {
    const config = node.config || {};
    console.log('更新节点配置:', config);
    
    // TODO: 实现更新逻辑
    
    return this.getNextNodeId(node.id, design);
  }

  // 执行删除节点
  async executeDeleteNode(node, design) {
    const config = node.config || {};
    console.log('删除节点配置:', config);
    
    // TODO: 实现删除逻辑
    
    return this.getNextNodeId(node.id, design);
  }

  // 执行是非分叉节点
  async executeBinaryBranchNode(node, design) {
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
  async executeExistCheckNode(node, design) {
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
  getExistCheckNextNode(node, design, exists) {
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
  compareValues(left, right, operator) {
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
  evaluateCompareCondition(config) {
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
  async executeAlertNode(node, design) {
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
  async executeJumpNode(node, design) {
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
  async executeCalculateNode(node, design) {
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
  calculateAssign(cfg) {
    if (!cfg || !cfg.varId) return null;
    let value = this.getVariableValue(cfg.varId);
    if (cfg.path && value && typeof value === 'object') {
      value = value[cfg.path];
    }
    return value;
  }

  // 计算-加法
  calculateAddition(cfg) {
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
  calculateSubtraction(cfg) {
    if (!cfg) return 0;
    const minuend = Number(this.getVariableValue(cfg.minuend)) || 0;
    const subtrahend = Number(this.getVariableValue(cfg.subtrahend)) || 0;
    return minuend - subtrahend;
  }

  // 计算-乘法
  calculateMultiplication(cfg) {
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
  calculateDivision(cfg) {
    if (!cfg) return 0;
    const dividend = Number(this.getVariableValue(cfg.dividend)) || 0;
    const divisor = Number(this.getVariableValue(cfg.divisor)) || 0;
    if (divisor === 0) return 0;
    return dividend / divisor;
  }

  // 计算-文本拼接
  calculateConcat(cfg) {
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
  getVariableValue(varId) {
    if (!varId) return null;
    // 支持带$和不带$的变量ID
    const normalizedId = varId.startsWith('$') ? varId.substring(1) : varId;
    return this.variables[varId] !== undefined ? this.variables[varId] : this.variables[normalizedId];
  }

  // 执行聚合节点
  async executeAggregateNode(node, design) {
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

  // ========== 辅助方法 ==========

  // 解析主键值
  resolvePrimaryKeyValue(primaryKeyConfig) {
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
  resolveVariableValue(path) {
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
  findFieldIdByName(obj, fieldName) {
    // 优先使用预加载的映射
    if (this.fieldNameToId && this.fieldNameToId[fieldName]) {
      return this.fieldNameToId[fieldName];
    }
    return null;
  }

  // 获取字段定义（从缓存中）
  getFieldDefinition(fieldId) {
    if (this.fieldIdToName && this.fieldIdToName[fieldId]) {
      return { id: fieldId, name: this.fieldIdToName[fieldId] };
    }
    return null;
  }

  // 解析系统值
  resolveSystemValue(systemVar) {
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
  replaceVariables(str) {
    return str.replace(/\{([^}]+)\}/g, (match, varPath) => {
      const value = this.resolveVariableValue(varPath);
      return value !== undefined ? String(value) : match;
    });
  }

  // 计算表达式
  evaluateExpression(expression) {
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
  async executeLoopStartNode(node, design) {
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
  evaluateLoopCondition(whileConfig) {
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
  getNestedValue(obj, path) {
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
  findLoopEndNextNode(loopStartNode, design) {
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
  async executeLoopEndNode(node, design) {
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
  async executeContinueNode(node, design) {
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
  async executeBreakNode(node, design) {
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
  findCurrentLoopStartId(nodeId, design) {
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

// 创建全局实例
window.FlowEngine = FlowEngine;
window.flowEngine = null;

// 辅助函数：初始化流程引擎
window.initFlowEngine = async function(projectId) {
  if (window.flowEngine) {
    window.flowEngine.destroy();
  }
  window.flowEngine = new FlowEngine();
  await window.flowEngine.init(projectId);
  console.log('FlowEngine 全局实例已创建');
};

// 辅助函数：销毁流程引擎
window.destroyFlowEngine = function() {
  if (window.flowEngine) {
    window.flowEngine.destroy();
    window.flowEngine = null;
    console.log('FlowEngine 全局实例已销毁');
  }
};

// 辅助函数：手动执行指定流程（用于调试）
window.runFlow = async function(flowId) {
  if (!window.flowEngine) {
    console.error('FlowEngine 未初始化');
    return;
  }
  
  const flow = window.flowEngine.dataFlows.find(f => f.id === flowId);
  if (!flow) {
    console.error('未找到流程:', flowId);
    console.log('可用流程:', window.flowEngine.dataFlows.map(f => ({ id: f.id, name: f.name })));
    return;
  }
  
  console.log('手动执行流程:', flow.name);
  await window.flowEngine.executeFlow(flow);
};

// 辅助函数：查看当前变量（用于调试）
window.showFlowVars = function() {
  if (!window.flowEngine) {
    console.error('FlowEngine 未初始化');
    return;
  }
  
  console.log('当前流程变量:', window.flowEngine.variables);
  return window.flowEngine.variables;
};

// 辅助函数：查看所有流程（用于调试）
window.showFlows = function() {
  if (!window.flowEngine) {
    console.error('FlowEngine 未初始化');
    return;
  }
  
  console.log('所有流程:');
  window.flowEngine.dataFlows.forEach(f => {
    console.log(`  - ${f.id}: ${f.name}`);
  });
  return window.flowEngine.dataFlows;
};

// 辅助函数：查看所有表单数据（用于调试）
window.showForms = function() {
  if (!window.flowEngine) {
    console.error('FlowEngine 未初始化');
    return;
  }
  
  console.log('所有表单:');
  window.flowEngine.forms.forEach(f => {
    console.log(`  - ${f.id}: ${f.name} (${f.data?.length || 0} 条数据)`);
  });
  return window.flowEngine.forms;
};
