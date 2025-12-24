// DND2 流程引擎 - 核心模块
// 原文件: src/flowEngine/FlowEngine.js (2,233行)
// Phase 4 拆分: 文件 1/4
//
// 包含：
// - FlowEngine类定义
// - 初始化方法 (init, loadFields, loadFormsWithData, destroy)
// - 事件处理 (handleButtonClick, findFlowByButton)
// - 流程执行 (executeFlow, executeNode, getNextNodeId)
// - 基本节点 (executeStartNode, executeEndNode)
// - 全局导出
//
// 依赖加载顺序: index.js -> dataNodes.js -> branchNodes.js -> loopNodes.js

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

console.log('[DND2] flowEngine/index.js 加载完成 - FlowEngine核心类已定义');
