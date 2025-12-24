// 原语注册表 - 管理所有原语的定义
const PrimitiveRegistry = {
  primitives: {},
  
  categories: [
    { id: 'flow', name: '流程节点', icon: '⚡', color: 'gray' },
    { id: 'data', name: '数据操作', icon: '📊', color: 'blue' },
    { id: 'branch', name: '分支控制', icon: '◇', color: 'yellow' },
    { id: 'interact', name: '交互操作', icon: '💬', color: 'green' },
    { id: 'loop', name: '循环控制', icon: '↺', color: 'purple' },
    { id: 'validate', name: '校验操作', icon: '✓', color: 'orange' },
    { id: 'calculate', name: '计算操作', icon: 'ƒ', color: 'indigo' },
    { id: 'external', name: '外部调用', icon: '⚡', color: 'red' }
  ],
  
  register(primitive) {
    if (!primitive.id) { console.error('原语缺少id'); return; }
    this.primitives[primitive.id] = primitive;
  },
  
  get(id) { return this.primitives[id]; },
  getAll() { return Object.values(this.primitives); },
  getByCategory(categoryId) { return Object.values(this.primitives).filter(p => p.category === categoryId); },
  getCategory(categoryId) { return this.categories.find(c => c.id === categoryId); },
  getCategories() { return this.categories; },
  
  generateNodeId(existingNodes) {
    if (!existingNodes || existingNodes.length === 0) return 'N001';
    const maxNum = existingNodes.reduce((max, node) => {
      const match = node.id.match(/N(\d+)/);
      return match ? Math.max(max, parseInt(match[1])) : max;
    }, 0);
    return 'N' + (maxNum + 1).toString().padStart(3, '0');
  }
};

// ========== 开始节点 ==========
PrimitiveRegistry.register({
  id: 'start', name: '开始', icon: '○', category: 'flow',
  description: '流程的起点，定义触发条件', color: 'green',
  defaultConfig: {
    triggerType: 'button',
    buttonConfig: { pageId: '', pageName: '', blockId: '', blockName: '' },
    intervalConfig: { interval: 60, unit: 'seconds', formId: '', formName: '', primaryKey: '', scanField: '' },
    scheduleConfig: { hour: 0, minute: 0 }
  },
  toDocument: function(config) {
    if (!config) return '○ 流程开始';
    switch(config.triggerType) {
      case 'button': return `○ 按钮触发：${config.buttonConfig?.pageName || '未设置'} - ${config.buttonConfig?.blockName || '未设置'}`;
      case 'interval': return `○ 间隔扫描：每${config.intervalConfig?.interval || 60}${config.intervalConfig?.unit === 'minutes' ? '分钟' : '秒'}`;
      case 'schedule': return `○ 定时触发：${String(config.scheduleConfig?.hour || 0).padStart(2,'0')}:${String(config.scheduleConfig?.minute || 0).padStart(2,'0')}`;
      default: return '○ 流程开始';
    }
  },
  canDelete: false, unique: true,
  connections: { hasInput: false, hasOutput: true, maxOutputs: 1 }
});

// ========== 结束节点 ==========
PrimitiveRegistry.register({
  id: 'end', name: '结束', icon: '◎', category: 'flow',
  description: '流程的终点，定义结束行为', color: 'red',
  defaultConfig: {
    endType: 'silent',
    alertConfig: { alertType: 'success', message: '' },
    jumpConfig: { pageId: '', pageName: '', openMode: 'replace', params: [] },
    backConfig: { refresh: false },
    refreshConfig: { message: '' },
    closePopupConfig: { refreshParent: false }
  },
  toDocument: function(config) {
    if (!config) return '◎ 流程结束';
    switch(config.endType) {
      case 'silent': return '◎ 静默结束';
      case 'alert': return `◎ 提示后结束："${config.alertConfig?.message || ''}"`;
      case 'jump': return `◎ 跳转：${config.jumpConfig?.pageName || '未设置'}`;
      case 'back': return `◎ 返回上一页${config.backConfig?.refresh ? '(刷新)' : ''}`;
      case 'refresh': return '◎ 刷新当前页';
      case 'closePopup': return `◎ 关闭弹窗${config.closePopupConfig?.refreshParent ? '(刷新父页)' : ''}`;
      default: return '◎ 流程结束';
    }
  },
  canDelete: false, unique: false,
  connections: { hasInput: true, hasOutput: false, maxOutputs: 0 }
});

// ========== 数据操作：读取 ==========
PrimitiveRegistry.register({
  id: 'read', name: '读取', icon: '□↓', category: 'data',
  description: '从页面或表单读取数据', color: 'blue',
  defaultConfig: {
    sourceType: 'form',
    pageSource: { pageId: '', pageName: '', blockId: '', blockName: '' },
    formSource: { formId: '', formName: '', primaryKeyMode: 'static', staticPrimaryKey: '', dynamicPrimaryKey: { type: 'variable', value: '' }, readMode: 'single', readCount: 10, conditions: [] },
    outputVar: ''
  },
  toDocument: function(config) {
    if (!config) return '□↓ 读取数据';
    if (config.sourceType === 'page') return `□↓ 读取输入：${config.pageSource?.blockName || '?'} → ${config.outputVar || '?'}`;
    const mode = config.formSource?.readMode === 'multiple' ? '多条' : '单条';
    return `□↓ 读取[${config.formSource?.formName || '?'}](${mode}) → ${config.outputVar || '?'}`;
  },
  canDelete: true, unique: false,
  connections: { hasInput: true, hasOutput: true, maxOutputs: 1 }
});

// ========== 数据操作：写入 ==========
PrimitiveRegistry.register({
  id: 'write', name: '写入', icon: '□↑', category: 'data',
  description: '向表单写入新数据', color: 'green',
  defaultConfig: { formId: '', formName: '', writeMode: 'variable', sourceVar: '', fieldMappings: [] },
  toDocument: function(config) { return `□↑ 写入[${config?.formName || '未设置'}]`; },
  canDelete: true, unique: false,
  connections: { hasInput: true, hasOutput: true, maxOutputs: 1 }
});

// ========== 数据操作：更新 ==========
PrimitiveRegistry.register({
  id: 'update', name: '更新', icon: '□↻', category: 'data',
  description: '更新表单中的数据', color: 'orange',
  defaultConfig: { formId: '', formName: '', conditions: [], fieldMappings: [] },
  toDocument: function(config) { return `□↻ 更新[${config?.formName || '未设置'}]`; },
  canDelete: true, unique: false,
  connections: { hasInput: true, hasOutput: true, maxOutputs: 1 }
});

// ========== 数据操作：删除 ==========
PrimitiveRegistry.register({
  id: 'delete', name: '删除', icon: '□✕', category: 'data',
  description: '删除表单中的数据', color: 'red',
  defaultConfig: { formId: '', formName: '', conditions: [], confirmDelete: false },
  toDocument: function(config) { return `□✕ 删除[${config?.formName || '未设置'}]`; },
  canDelete: true, unique: false,
  connections: { hasInput: true, hasOutput: true, maxOutputs: 1 }
});

// ========== 分支控制：是非分叉 ==========
PrimitiveRegistry.register({
  id: 'binaryBranch', name: '是非分叉', icon: '◇', category: 'branch',
  description: '根据条件判断走两个分支之一', color: 'yellow',
  defaultConfig: { expression: '', yesBranch: { type: 'node', nodeId: '' }, noBranch: { type: 'node', nodeId: '' } },
  toDocument: function(config) { return `◇ 判断：${config?.expression || '?'}`; },
  canDelete: true, unique: false,
  connections: { hasInput: true, hasOutput: true, maxOutputs: 2, outputLabels: ['是', '否'] },
  isBranch: true, branchType: 'binary'
});

// ========== 分支控制：多条件分叉 ==========
PrimitiveRegistry.register({
  id: 'multiBranch', name: '多条件分叉', icon: '◆', category: 'branch',
  description: '根据条件走多个分支之一', color: 'orange',
  defaultConfig: { pipeCount: 2, pipes: [{ label: '1号管道', type: 'node', nodeId: '' }, { label: '2号管道', type: 'node', nodeId: '' }] },
  toDocument: function(config) { return `◆ ${config?.pipeCount || 2}路分叉`; },
  canDelete: true, unique: false,
  connections: { hasInput: true, hasOutput: true, maxOutputs: -1, dynamic: true },
  isBranch: true, branchType: 'multi'
});

// ========== 交互操作：提示 ==========
PrimitiveRegistry.register({
  id: 'alert', name: '提示', icon: '💬', category: 'interact',
  description: '显示提示信息', color: 'blue',
  defaultConfig: { alertType: 'success', message: '', confirmConfig: { confirmText: '确定', cancelText: '取消', confirmNodeId: '', cancelNodeId: '' }, afterBehavior: 'continue' },
  toDocument: function(config) { const t = {success:'成功',error:'错误',warning:'警告',info:'信息',confirm:'确认'}; return `💬 ${t[config?.alertType]||'提示'}："${config?.message||''}"`; },
  canDelete: true, unique: false,
  connections: { hasInput: true, hasOutput: true, maxOutputs: 1 }
});

// ========== 交互操作：跳转 ==========
PrimitiveRegistry.register({
  id: 'jump', name: '跳转', icon: '⬚→', category: 'interact',
  description: '跳转到指定页面', color: 'purple',
  defaultConfig: { pageId: '', pageName: '', openMode: 'replace', params: [], afterJump: 'end' },
  toDocument: function(config) { return `⬚→ 跳转[${config?.pageName || '?'}]`; },
  canDelete: true, unique: false,
  connections: { hasInput: true, hasOutput: true, maxOutputs: 1 }
});

// ========== 循环控制：循环开始 ==========
PrimitiveRegistry.register({
  id: 'loopStart', name: '循环开始', icon: '🔁', category: 'loop',
  description: '定义循环方式和参数', color: 'purple',
  defaultConfig: { 
    loopType: 'forEach',  // forEach(遍历对象) 或 while(条件判断)
    // 遍历对象配置
    forEachConfig: { 
      sourceVar: '',           // 数据来源变量（数组）
      sourceVarName: '',
      itemVar: 'item',         // 当前项变量名
      indexVar: 'index'        // 索引变量名
    },
    // 条件判断配置
    whileConfig: {
      conditionType: 'expression',  // expression(表达式) 或 maxCount(最大次数)
      expression: '',               // 条件表达式
      leftVariableId: '',           // 左侧变量
      leftVariablePath: '',
      operator: '!=',
      rightType: 'constant',        // constant(常量) 或 variable(变量)
      rightValue: '',
      rightVariableId: '',
      rightVariablePath: '',
      maxCount: 100,                // 最大循环次数（防止死循环）
      countVar: 'loopCount'         // 计数变量名
    },
    loopEndNodeId: ''  // 对应的循环结束节点ID
  },
  toDocument: function(config) { 
    if(config?.loopType === 'forEach') {
      return `🔁 遍历 ${config?.forEachConfig?.sourceVarName || config?.forEachConfig?.sourceVar || '?'}`;
    }
    return `🔁 当条件满足时循环`;
  },
  canDelete: true, unique: false,
  connections: { hasInput: true, hasOutput: true, maxOutputs: 1 },
  isLoop: true, loopRole: 'start'
});

// ========== 循环控制：循环结束 ==========
PrimitiveRegistry.register({
  id: 'loopEnd', name: '循环结束', icon: '🔚', category: 'loop',
  description: '循环结束判断点', color: 'purple',
  defaultConfig: { 
    loopStartNodeId: ''  // 对应的循环开始节点ID
  },
  toDocument: function(config) { 
    return `🔚 循环结束`;
  },
  canDelete: true, unique: false,
  connections: { hasInput: true, hasOutput: true, maxOutputs: 1 },
  isLoop: true, loopRole: 'end'
});

// ========== 循环控制：跳过(continue) ==========
PrimitiveRegistry.register({
  id: 'continue', name: '跳过', icon: '⏭️', category: 'loop',
  description: '跳过当前迭代，继续下一次循环', color: 'blue',
  defaultConfig: {},
  toDocument: function() { return '⏭️ 跳过当前迭代'; },
  canDelete: true, unique: false,
  connections: { hasInput: true, hasOutput: false, maxOutputs: 0 },
  isLoop: true, loopRole: 'continue'
});

// ========== 循环控制：跳出(break) ==========
PrimitiveRegistry.register({
  id: 'break', name: '跳出', icon: '⏹️', category: 'loop',
  description: '跳出整个循环', color: 'red',
  defaultConfig: {},
  toDocument: function() { return '⏹️ 跳出循环'; },
  canDelete: true, unique: false,
  connections: { hasInput: true, hasOutput: false, maxOutputs: 0 },
  isLoop: true, loopRole: 'break'
});

// ========== 循环控制：等待 ==========
PrimitiveRegistry.register({
  id: 'wait', name: '等待', icon: '⏸', category: 'loop',
  description: '等待一段时间或条件满足', color: 'gray',
  defaultConfig: { waitType: 'duration', durationConfig: { duration: 1, unit: 'seconds' }, conditionConfig: { expression: '', checkInterval: 5, maxWait: 300, maxWaitUnit: 'seconds', timeoutNodeId: '' } },
  toDocument: function(config) { if(config?.waitType==='duration'){ const u={seconds:'秒',minutes:'分钟',hours:'小时',days:'天'}; return `⏸ 等待 ${config?.durationConfig?.duration||1} ${u[config?.durationConfig?.unit]||'秒'}`; } return '⏸ 等待条件'; },
  canDelete: true, unique: false,
  connections: { hasInput: true, hasOutput: true, maxOutputs: 1 }
});

// ========== 校验：存在性校验 ==========
PrimitiveRegistry.register({
  id: 'existCheck', name: '存在性校验', icon: '✓?', category: 'validate',
  description: '检查数据是否存在', color: 'orange',
  defaultConfig: { formId: '', formName: '', conditions: [], existNodeId: '', notExistNodeId: '' },
  toDocument: function(config) { return `✓? 检查[${config?.formName||'?'}]是否存在`; },
  canDelete: true, unique: false,
  connections: { hasInput: true, hasOutput: true, maxOutputs: 2, outputLabels: ['存在', '不存在'] },
  isBranch: true, branchType: 'binary'
});

// ========== 校验：数据格式校验 ==========
PrimitiveRegistry.register({
  id: 'formatCheck', name: '格式校验', icon: '✓!', category: 'validate',
  description: '校验数据格式', color: 'orange',
  defaultConfig: { rules: [], passNodeId: '', failNodeId: '', failMode: 'first' },
  toDocument: function(config) { return `✓! 格式校验(${config?.rules?.length||0}条)`; },
  canDelete: true, unique: false,
  connections: { hasInput: true, hasOutput: true, maxOutputs: 2, outputLabels: ['通过', '未通过'] },
  isBranch: true, branchType: 'binary'
});

// ========== 校验：属性校验 ==========
PrimitiveRegistry.register({
  id: 'propCheck', name: '属性校验', icon: '✓', category: 'validate',
  description: '根据属性值确定分叉管道', color: 'orange',
  defaultConfig: { checkTarget: '', checkMode: 'enum', enumRules: [], rangeRules: [], defaultPipe: 1 },
  toDocument: function(config) { return `✓ 属性校验：${config?.checkTarget||'?'}`; },
  canDelete: true, unique: false,
  connections: { hasInput: true, hasOutput: true, maxOutputs: -1, dynamic: true },
  isBranch: true, branchType: 'multi'
});

// ========== 计算：表达式计算 ==========
PrimitiveRegistry.register({
  id: 'calculate', name: '计算', icon: 'ƒ', category: 'calculate',
  description: '执行表达式计算', color: 'indigo',
  defaultConfig: { expression: '', outputVar: '' },
  toDocument: function(config) { return `ƒ ${config?.expression||'?'} → ${config?.outputVar||'?'}`; },
  canDelete: true, unique: false,
  connections: { hasInput: true, hasOutput: true, maxOutputs: 1 }
});

// ========== 计算：聚合计算 ==========
PrimitiveRegistry.register({
  id: 'aggregate', name: '聚合', icon: 'Σ', category: 'calculate',
  description: '对数组进行聚合计算', color: 'indigo',
  defaultConfig: { sourceVar: '', method: 'sum', field: '', outputVar: '' },
  toDocument: function(config) { const m={sum:'求和',count:'计数',avg:'平均',max:'最大',min:'最小'}; return `Σ ${m[config?.method]||'?'} ${config?.sourceVar||'?'}.${config?.field||'*'} → ${config?.outputVar||'?'}`; },
  canDelete: true, unique: false,
  connections: { hasInput: true, hasOutput: true, maxOutputs: 1 }
});

// ========== 外部调用：调用接口 ==========
PrimitiveRegistry.register({
  id: 'apiCall', name: '调用接口', icon: '⚡', category: 'external',
  description: '调用外部API', color: 'red',
  defaultConfig: { url: '', method: 'GET', headers: [], params: [], outputVar: '', outputPath: '', timeout: 30, failNodeId: '' },
  toDocument: function(config) { return `⚡ ${config?.method||'GET'} ${config?.url||'?'}`; },
  canDelete: true, unique: false,
  connections: { hasInput: true, hasOutput: true, maxOutputs: 1 }
});

// ========== 外部调用：调用子流程 ==========
PrimitiveRegistry.register({
  id: 'subFlow', name: '子流程', icon: '▣', category: 'external',
  description: '调用另一个流程', color: 'purple',
  defaultConfig: { flowId: '', flowName: '', params: [], outputVar: '', callMode: 'sync' },
  toDocument: function(config) { return `▣ 调用[${config?.flowName||'?'}]`; },
  canDelete: true, unique: false,
  connections: { hasInput: true, hasOutput: true, maxOutputs: 1 }
});

window.PrimitiveRegistry = PrimitiveRegistry;
