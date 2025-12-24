// DND2 数据库模块 - 数据流程与变量管理操作
// 原文件位置: src/utils/db.js 第925-1389行
// 
// API列表 (20个):
// 数据流程管理 (7个):
// - generateDataFlowId(project)
// - addDataFlow(projectId, dataFlow)
// - getDataFlowsByProjectId(projectId)
// - getDataFlowById(projectId, flowId)
// - updateDataFlow(projectId, flowId, updatedFlow)
// - deleteDataFlow(projectId, flowId)
// - saveDataFlowDesign(projectId, flowId, design)
// 
// 中间变量管理 (13个):
// - generateVariableId(project)
// - incrementVariableId(id)
// - addVariable(projectId, variableInfo)
// - getVariables(projectId)
// - getVariableById(projectId, variableId)
// - updateVariable(projectId, variableId, updates)
// - deleteVariable(projectId, variableId, force)
// - addVariableUsage(projectId, variableId, nodeId, flowId)
// - removeVariableUsage(projectId, variableId, nodeId, flowId)
// - checkNodeDeletable(projectId, nodeId, flowId)
// - cleanupFlowVariables(projectId, flowId)
// - getVariablesBySourceType(projectId, sourceTypes)
// - traceVariableSource(projectId, variableId)

(function() {
  const proto = window.DNDDatabase.prototype;

  // ==================== 数据流程管理（项目级别）====================

  /**
   * 生成数据流程ID（FLOW-序号）
   * @param {Object} project - 项目对象
   * @returns {string} 新的流程ID
   */
  proto.generateDataFlowId = function(project) {
    if (!project.dataFlows || project.dataFlows.length === 0) {
      return 'FLOW-001';
    }

    const maxNum = project.dataFlows.reduce((max, flow) => {
      const num = parseInt(flow.id.split('-')[1]);
      return num > max ? num : max;
    }, 0);

    const nextNum = maxNum + 1;
    return `FLOW-${nextNum.toString().padStart(3, '0')}`;
  };

  /**
   * 添加数据流程
   * @param {string} projectId - 项目ID
   * @param {Object} dataFlow - 数据流程对象
   * @returns {Promise<Object>} 新创建的流程
   */
  proto.addDataFlow = async function(projectId, dataFlow) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const flowId = this.generateDataFlowId(project);

    const newDataFlow = {
      ...dataFlow,
      id: flowId,
      createdAt: new Date().toISOString(),
      design: null  // 流程设计数据（节点、连线等）
    };

    project.dataFlows = project.dataFlows || [];
    project.dataFlows.push(newDataFlow);
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return newDataFlow;
  };

  /**
   * 获取项目的所有数据流程
   * @param {string} projectId - 项目ID
   * @returns {Promise<Array>} 流程列表
   */
  proto.getDataFlowsByProjectId = async function(projectId) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }
    return project.dataFlows || [];
  };

  /**
   * 根据ID获取数据流程
   * @param {string} projectId - 项目ID
   * @param {string} flowId - 流程ID
   * @returns {Promise<Object>} 流程对象
   */
  proto.getDataFlowById = async function(projectId, flowId) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }
    return (project.dataFlows || []).find(f => f.id === flowId);
  };

  /**
   * 更新数据流程
   * @param {string} projectId - 项目ID
   * @param {string} flowId - 流程ID
   * @param {Object} updatedFlow - 更新的流程数据
   * @returns {Promise<Object>} 更新后的流程
   */
  proto.updateDataFlow = async function(projectId, flowId, updatedFlow) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const flowIndex = (project.dataFlows || []).findIndex(f => f.id === flowId);
    if (flowIndex === -1) {
      throw new Error('数据流程不存在');
    }

    project.dataFlows[flowIndex] = {
      ...project.dataFlows[flowIndex],
      ...updatedFlow,
      updatedAt: new Date().toISOString()
    };
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return project.dataFlows[flowIndex];
  };

  /**
   * 删除数据流程
   * @param {string} projectId - 项目ID
   * @param {string} flowId - 流程ID
   * @returns {Promise<string>} 删除的流程ID
   */
  proto.deleteDataFlow = async function(projectId, flowId) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    project.dataFlows = (project.dataFlows || []).filter(f => f.id !== flowId);
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return flowId;
  };

  /**
   * 保存数据流程设计
   * @param {string} projectId - 项目ID
   * @param {string} flowId - 流程ID
   * @param {Object} design - 流程设计数据
   * @returns {Promise<Object>} 更新后的流程
   */
  proto.saveDataFlowDesign = async function(projectId, flowId, design) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const flowIndex = (project.dataFlows || []).findIndex(f => f.id === flowId);
    if (flowIndex === -1) {
      throw new Error('数据流程不存在');
    }

    project.dataFlows[flowIndex].design = design;
    project.dataFlows[flowIndex].updatedAt = new Date().toISOString();
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return project.dataFlows[flowIndex];
  };

  // ==================== 中间变量管理 ====================

  /**
   * 生成下一个变量ID（5位小写字母，aaaaa -> aaaab -> ... -> zzzzz）
   * @param {Object} project - 项目对象
   * @returns {string} 新的变量ID
   */
  proto.generateVariableId = function(project) {
    const variables = project.variables || [];
    
    if (variables.length === 0) {
      return 'aaaaa';
    }

    // 找出最大的变量ID
    let maxId = 'aaaaa';
    for (const v of variables) {
      if (v.id > maxId) {
        maxId = v.id;
      }
    }

    // 递增变量ID
    return this.incrementVariableId(maxId);
  };

  /**
   * 递增变量ID
   * @param {string} id - 当前ID（5位小写字母）
   * @returns {string} 下一个ID
   */
  proto.incrementVariableId = function(id) {
    const chars = id.split('');
    let i = chars.length - 1;

    while (i >= 0) {
      if (chars[i] === 'z') {
        chars[i] = 'a';
        i--;
      } else {
        chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1);
        break;
      }
    }

    // 如果所有位都进位了，说明已经到达zzzzz，返回错误标识
    if (i < 0) {
      throw new Error('变量数量已达上限');
    }

    return chars.join('');
  };

  /**
   * 添加中间变量
   * @param {string} projectId - 项目ID
   * @param {Object} variableInfo - 变量信息
   * @returns {Promise<Object>} 新创建的变量
   */
  proto.addVariable = async function(projectId, variableInfo) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    // 初始化变量数组
    if (!project.variables) {
      project.variables = [];
    }

    const variableId = this.generateVariableId(project);

    const newVariable = {
      id: variableId,
      name: variableInfo.name || '',           // 用户填写的描述名称（可选）
      sourceNodeId: variableInfo.sourceNodeId, // 来源节点ID
      sourceNodeType: variableInfo.sourceNodeType, // 来源节点类型：read/calculate/aggregate等
      sourceFormId: variableInfo.sourceFormId || null, // 如果来源是读取节点，记录表单ID
      sourceFormName: variableInfo.sourceFormName || null, // 表单名称
      dataType: variableInfo.dataType || 'unknown', // 数据类型：array/object/value
      flowId: variableInfo.flowId,             // 所属流程ID
      flowName: variableInfo.flowName || '',   // 流程名称
      usedBy: [],                              // 使用该变量的节点列表 [{nodeId, flowId}]
      createdAt: new Date().toISOString()
    };

    project.variables.push(newVariable);
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return newVariable;
  };

  /**
   * 获取项目的所有中间变量
   * @param {string} projectId - 项目ID
   * @returns {Promise<Array>} 变量列表
   */
  proto.getVariables = async function(projectId) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }
    return project.variables || [];
  };

  /**
   * 根据ID获取变量
   * @param {string} projectId - 项目ID
   * @param {string} variableId - 变量ID
   * @returns {Promise<Object|null>} 变量对象
   */
  proto.getVariableById = async function(projectId, variableId) {
    const variables = await this.getVariables(projectId);
    return variables.find(v => v.id === variableId) || null;
  };

  /**
   * 更新变量信息
   * @param {string} projectId - 项目ID
   * @param {string} variableId - 变量ID
   * @param {Object} updates - 要更新的字段
   * @returns {Promise<Object>} 更新后的变量
   */
  proto.updateVariable = async function(projectId, variableId, updates) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const varIndex = (project.variables || []).findIndex(v => v.id === variableId);
    if (varIndex === -1) {
      throw new Error('变量不存在');
    }

    project.variables[varIndex] = {
      ...project.variables[varIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return project.variables[varIndex];
  };

  /**
   * 删除变量（需要检查是否被使用）
   * @param {string} projectId - 项目ID
   * @param {string} variableId - 变量ID
   * @param {boolean} force - 是否强制删除（忽略使用检查）
   * @returns {Promise<string>} 删除的变量ID
   */
  proto.deleteVariable = async function(projectId, variableId, force = false) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const variable = (project.variables || []).find(v => v.id === variableId);
    if (!variable) {
      throw new Error('变量不存在');
    }

    // 检查是否被使用
    if (!force && variable.usedBy && variable.usedBy.length > 0) {
      throw new Error(`变量 ${variableId} 正在被 ${variable.usedBy.length} 个节点使用，无法删除`);
    }

    project.variables = (project.variables || []).filter(v => v.id !== variableId);
    project.updatedAt = new Date().toISOString();

    await this.updateProject(project);
    return variableId;
  };

  /**
   * 记录变量被使用
   * @param {string} projectId - 项目ID
   * @param {string} variableId - 变量ID
   * @param {string} nodeId - 使用该变量的节点ID
   * @param {string} flowId - 节点所在的流程ID
   * @returns {Promise<Object>} 更新后的变量
   */
  proto.addVariableUsage = async function(projectId, variableId, nodeId, flowId) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const varIndex = (project.variables || []).findIndex(v => v.id === variableId);
    if (varIndex === -1) {
      throw new Error('变量不存在');
    }

    const variable = project.variables[varIndex];
    if (!variable.usedBy) {
      variable.usedBy = [];
    }

    // 检查是否已经记录过
    const exists = variable.usedBy.some(u => u.nodeId === nodeId && u.flowId === flowId);
    if (!exists) {
      variable.usedBy.push({ nodeId, flowId, addedAt: new Date().toISOString() });
      project.updatedAt = new Date().toISOString();
      await this.updateProject(project);
    }

    return variable;
  };

  /**
   * 移除变量的使用记录
   * @param {string} projectId - 项目ID
   * @param {string} variableId - 变量ID
   * @param {string} nodeId - 节点ID
   * @param {string} flowId - 流程ID
   * @returns {Promise<Object>} 更新后的变量
   */
  proto.removeVariableUsage = async function(projectId, variableId, nodeId, flowId) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const varIndex = (project.variables || []).findIndex(v => v.id === variableId);
    if (varIndex === -1) {
      return; // 变量不存在，静默返回
    }

    const variable = project.variables[varIndex];
    if (variable.usedBy) {
      variable.usedBy = variable.usedBy.filter(u => !(u.nodeId === nodeId && u.flowId === flowId));
      project.updatedAt = new Date().toISOString();
      await this.updateProject(project);
    }

    return variable;
  };

  /**
   * 检查节点是否可以删除（其产出的变量是否被使用）
   * @param {string} projectId - 项目ID
   * @param {string} nodeId - 节点ID
   * @param {string} flowId - 流程ID
   * @returns {Promise<Object>} { canDelete: boolean, usedVariables: Array }
   */
  proto.checkNodeDeletable = async function(projectId, nodeId, flowId) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const variables = project.variables || [];
    
    // 找出该节点产出的所有变量
    const producedVariables = variables.filter(v => v.sourceNodeId === nodeId && v.flowId === flowId);
    
    // 检查这些变量是否被其他节点使用
    const usedVariables = producedVariables.filter(v => v.usedBy && v.usedBy.length > 0);

    return {
      canDelete: usedVariables.length === 0,
      usedVariables: usedVariables.map(v => ({
        id: v.id,
        name: v.name,
        usedByCount: v.usedBy.length,
        usedBy: v.usedBy
      }))
    };
  };

  /**
   * 清理流程相关的变量（删除流程时调用）
   * @param {string} projectId - 项目ID
   * @param {string} flowId - 流程ID
   */
  proto.cleanupFlowVariables = async function(projectId, flowId) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    // 删除该流程产出的所有变量
    project.variables = (project.variables || []).filter(v => v.flowId !== flowId);

    // 清理其他变量中该流程节点的使用记录
    for (const variable of (project.variables || [])) {
      if (variable.usedBy) {
        variable.usedBy = variable.usedBy.filter(u => u.flowId !== flowId);
      }
    }

    project.updatedAt = new Date().toISOString();
    await this.updateProject(project);
  };

  /**
   * 根据来源节点类型获取变量列表
   * @param {string} projectId - 项目ID
   * @param {Array<string>} sourceTypes - 来源节点类型数组
   * @returns {Promise<Array>} 符合条件的变量列表
   */
  proto.getVariablesBySourceType = async function(projectId, sourceTypes = []) {
    const variables = await this.getVariables(projectId);
    
    if (sourceTypes.length === 0) {
      return variables;
    }
    
    return variables.filter(v => sourceTypes.includes(v.sourceNodeType));
  };

  /**
   * 逆向检索：通过变量ID获取其来源信息
   * @param {string} projectId - 项目ID
   * @param {string} variableId - 变量ID
   * @returns {Promise<Object|null>} 来源信息
   */
  proto.traceVariableSource = async function(projectId, variableId) {
    const variable = await this.getVariableById(projectId, variableId);
    if (!variable) {
      return null;
    }

    // 如果来源是读取节点，返回表单信息
    if (variable.sourceNodeType === 'read' && variable.sourceFormId) {
      const project = await this.getProjectById(projectId);
      const form = (project.forms || []).find(f => f.id === variable.sourceFormId);
      
      return {
        variableId: variable.id,
        variableName: variable.name,
        sourceType: 'read',
        sourceNodeId: variable.sourceNodeId,
        sourceFormId: variable.sourceFormId,
        sourceFormName: variable.sourceFormName || form?.name,
        dataType: variable.dataType,
        formStructure: form?.structure || null
      };
    }

    // 其他来源类型
    return {
      variableId: variable.id,
      variableName: variable.name,
      sourceType: variable.sourceNodeType,
      sourceNodeId: variable.sourceNodeId,
      dataType: variable.dataType
    };
  };

  console.log('[DND2] db/flowOperations.js 加载完成 - 20个流程/变量API已注册');
})();
