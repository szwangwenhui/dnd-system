// 存在性校验节点配置表单
// 逻辑：从中间变量获取校验对象，去目标表单中检查是否存在匹配记录
function ExistCheckConfigForm({ 
  node, 
  nodes, 
  forms, 
  fields, 
  onUpdate,
  projectId,
  flowId
}) {
  const config = node.config || {};
  const matchRules = config.matchRules || [];
  
  const availableNodes = nodes.filter(n => n.id !== node.id);

  // 变量相关状态
  const [variables, setVariables] = React.useState([]);
  const [loadingVars, setLoadingVars] = React.useState(false);

  // 加载变量列表
  React.useEffect(() => {
    if (projectId) {
      loadVariables();
    }
  }, [projectId]);

  const loadVariables = async () => {
    setLoadingVars(true);
    try {
      const vars = await window.dndDB.getVariables(projectId);
      setVariables(vars || []);
    } catch (error) {
      console.error('加载变量列表失败:', error);
    } finally {
      setLoadingVars(false);
    }
  };

  // 获取变量的字段列表
  const getVariableFields = (variableId) => {
    console.log('getVariableFields 调用:', { variableId, variables: variables?.length, forms: forms?.length });
    if (!variableId || !variables || !forms) return [];
    const variable = variables.find(v => v.id === variableId);
    console.log('找到的变量:', variable);
    if (!variable || !variable.sourceFormId) {
      console.log('变量不存在或没有sourceFormId');
      return [];
    }
    
    const form = forms.find(f => f.id === variable.sourceFormId);
    console.log('找到的表单:', form?.id, form?.name, form?.type);
    if (!form || !form.structure) {
      console.log('表单不存在或没有structure');
      return [];
    }
    
    // 根据表单类型返回字段列表
    if (form.type === '属性表单') {
      // 属性表使用 levelFields
      const result = form.structure.levelFields || [];
      console.log('属性表字段:', result);
      return result;
    } else {
      // 基础表使用 fields
      const result = form.structure.fields || [];
      console.log('基础表字段:', result);
      return result;
    }
  };

  // 获取字段名称
  const getFieldName = (fieldId) => {
    if (!fieldId || !fields) return fieldId;
    const field = fields.find(f => f.id === fieldId);
    return field?.name || fieldId;
  };

  // 获取目标表单的字段列表
  const getTargetFormFields = () => {
    if (!config.targetFormId || !forms) return [];
    const form = forms.find(f => f.id === config.targetFormId);
    if (!form || !form.structure) return [];
    return form.structure.fields || [];
  };

  // 获取数据类型文本
  const getDataTypeText = (type) => {
    switch (type) {
      case 'array': return '数组';
      case 'object': return '对象';
      case 'value': return '单值';
      default: return type || '未知';
    }
  };
  
  // 单个字段更新
  const updateConfig = (key, value) => {
    onUpdate({
      config: { ...config, [key]: value }
    });
  };

  // 批量更新配置（解决连续更新覆盖问题）
  const updateConfigBatch = (updates) => {
    onUpdate({
      config: { ...config, ...updates }
    });
  };

  // 选择校验对象变量
  const handleSelectSourceVariable = async (variableId) => {
    if (node.id && flowId && projectId && variableId) {
      try {
        await window.dndDB.addVariableUsage(projectId, variableId, node.id, flowId);
      } catch (error) {
        console.error('记录变量使用失败:', error);
      }
    }
    
    // 重新加载变量列表，确保获取最新的变量信息
    await loadVariables();
    
    // 调试：打印选中变量的信息
    const vars = await window.dndDB.getVariables(projectId);
    const selectedVar = vars?.find(v => v.id === variableId);
    console.log('选中的变量详情:', selectedVar);
    console.log('变量的sourceFormId:', selectedVar?.sourceFormId);
    
    // 批量更新，避免覆盖
    updateConfigBatch({
      sourceVariableId: variableId,
      sourceVariablePath: '',
      matchRules: []
    });
  };

  // 选择目标表单
  const handleSelectTargetForm = (formId) => {
    const form = forms?.find(f => f.id === formId);
    // 批量更新，避免覆盖
    updateConfigBatch({
      targetFormId: formId,
      targetFormName: form?.name || '',
      matchRules: []
    });
  };

  // 添加匹配规则
  const addMatchRule = () => {
    updateConfig('matchRules', [
      ...matchRules,
      { 
        id: Date.now(), 
        sourceField: '',      // 校验对象的字段
        targetField: '',      // 目标表单的字段
        operator: '=='        // 匹配运算符
      }
    ]);
  };

  // 更新匹配规则
  const updateMatchRule = (index, updates) => {
    const newRules = [...matchRules];
    newRules[index] = { ...newRules[index], ...updates };
    updateConfig('matchRules', newRules);
  };

  // 删除匹配规则
  const removeMatchRule = (index) => {
    updateConfig('matchRules', matchRules.filter((_, i) => i !== index));
  };

  // 运算符选项
  const operators = [
    { value: '==', label: '等于' },
    { value: '!=', label: '不等于' },
    { value: '>', label: '大于' },
    { value: '>=', label: '大于等于' },
    { value: '<', label: '小于' },
    { value: '<=', label: '小于等于' }
  ];

  const sourceFields = getVariableFields(config.sourceVariableId);
  const targetFields = getTargetFormFields();
  
  // 获取选中变量的类型
  const selectedVariable = variables.find(v => v.id === config.sourceVariableId);
  const isSourceSingleValue = selectedVariable?.dataType === 'value';
  const isSourceArray = selectedVariable?.dataType === 'array';

  return (
    <div className="space-y-4">
      {/* 校验对象：从中间变量选择 */}
      <div className="bg-blue-900/30 p-3 rounded border border-blue-700">
        <label className="block text-sm font-medium text-blue-300 mb-2">
          📦 校验对象（从中间变量选择）<span className="text-red-400">*</span>
        </label>
        {loadingVars ? (
          <div className="text-sm text-gray-400">加载中...</div>
        ) : variables.length === 0 ? (
          <div className="text-sm text-yellow-400">
            ⚠️ 暂无可用变量，请先添加读取节点创建变量
          </div>
        ) : (
          <select
            value={config.sourceVariableId || ''}
            onChange={(e) => handleSelectSourceVariable(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          >
            <option value="">-- 选择变量 --</option>
            {variables.filter(v => v.dataType === 'object' || v.dataType === 'array').map(v => (
              <option key={v.id} value={v.id}>
                {v.id} {v.name ? `(${v.name})` : ''} [{getDataTypeText(v.dataType)}]
              </option>
            ))}
          </select>
        )}
        {/* 如果没有对象类型的变量 */}
        {variables.length > 0 && variables.filter(v => v.dataType === 'object' || v.dataType === 'array').length === 0 && (
          <div className="mt-2 text-xs text-yellow-400">
            ⚠️ 没有可用的对象类型变量。存在性校验需要包含字段的对象，请在读取节点中选择多个字段。
          </div>
        )}
        {config.sourceVariableId && (
          <div className="mt-2 text-xs text-gray-400">
            将使用变量 <span className="text-blue-300">{config.sourceVariableId}</span> 的数据进行校验
          </div>
        )}
        {config.sourceVariableId && isSourceSingleValue && (
          <div className="mt-2 text-xs text-red-400 bg-red-900/30 p-2 rounded">
            ⚠️ 警告：该变量是单值类型，不适合存在性校验。请选择包含字段的对象类型变量。
          </div>
        )}
      </div>

      {/* 目标表单：去哪里检查 */}
      <div className="bg-green-900/30 p-3 rounded border border-green-700">
        <label className="block text-sm font-medium text-green-300 mb-2">
          📋 目标表单（去哪里检查）<span className="text-red-400">*</span>
        </label>
        <select
          value={config.targetFormId || ''}
          onChange={(e) => handleSelectTargetForm(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        >
          <option value="">-- 选择表单 --</option>
          {forms?.filter(f => f.subType === '独立基础表' || f.subType === '关联基础表').map(form => (
            <option key={form.id} value={form.id}>{form.name}</option>
          ))}
        </select>
        {config.targetFormId && (
          <div className="mt-2 text-xs text-gray-400">
            将在表单 <span className="text-green-300">{config.targetFormName}</span> 中查找匹配记录
          </div>
        )}
      </div>

      {/* 匹配规则 - 只有当校验对象是对象/数组类型时才显示 */}
      {config.sourceVariableId && config.targetFormId && !isSourceSingleValue && (
        <div className="bg-gray-800 p-3 rounded border border-gray-600">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            🔗 匹配规则（如何判断存在）
          </label>
          <p className="text-xs text-gray-400 mb-3">
            设置校验对象与目标表单之间的字段对应关系
          </p>
          
          {matchRules.length > 0 && (
            <div className="space-y-2 mb-3">
              {matchRules.map((rule, index) => (
                <div key={rule.id} className="flex items-center space-x-2 bg-gray-700/50 p-2 rounded">
                  {/* 校验对象的字段 */}
                  <div className="flex-1">
                    <div className="text-xs text-blue-400 mb-1">校验对象字段</div>
                    <select
                      value={rule.sourceField}
                      onChange={(e) => updateMatchRule(index, { sourceField: e.target.value })}
                      className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    >
                      <option value="">选择字段</option>
                      {sourceFields.map(f => (
                        <option key={f.fieldId} value={f.fieldId}>
                          {f.fieldId} ({getFieldName(f.fieldId)})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* 运算符 */}
                  <div className="w-20">
                    <div className="text-xs text-gray-400 mb-1">运算符</div>
                    <select
                      value={rule.operator}
                      onChange={(e) => updateMatchRule(index, { operator: e.target.value })}
                      className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    >
                      {operators.map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* 目标表单的字段 */}
                  <div className="flex-1">
                    <div className="text-xs text-green-400 mb-1">目标表单字段</div>
                    <select
                      value={rule.targetField}
                      onChange={(e) => updateMatchRule(index, { targetField: e.target.value })}
                      className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    >
                      <option value="">选择字段</option>
                      {targetFields.map(f => (
                        <option key={f.fieldId} value={f.fieldId}>
                          {f.fieldId} ({getFieldName(f.fieldId)})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={() => removeMatchRule(index)}
                    className="text-red-400 hover:text-red-300 px-2 self-end pb-1.5"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <button
            onClick={addMatchRule}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            + 添加匹配规则
          </button>

          {matchRules.length === 0 && (
            <div className="mt-2 text-xs text-yellow-400">
              ⚠️ 请至少添加一条匹配规则
            </div>
          )}
        </div>
      )}

      {/* 匹配预览 */}
      {/* 匹配预览 - 只有对象/数组类型才显示 */}
      {matchRules.length > 0 && !isSourceSingleValue && (
        <div className="bg-gray-700/30 p-3 rounded">
          <div className="text-xs text-gray-400 mb-1">校验逻辑预览：</div>
          <div className="text-sm text-white">
            在 <span className="text-green-300">{config.targetFormName}</span> 中查找满足以下条件的记录：
          </div>
          <div className="mt-1 pl-4 text-sm">
            {matchRules.map((rule, index) => (
              <div key={rule.id} className="text-gray-300">
                {index > 0 && <span className="text-yellow-400">且 </span>}
                <span className="text-green-300">{rule.targetField} ({getFieldName(rule.targetField) || '?'})</span>
                <span className="text-gray-400"> {operators.find(o => o.value === rule.operator)?.label} </span>
                <span className="text-blue-300">{config.sourceVariableId}.{rule.sourceField} ({getFieldName(rule.sourceField) || '?'})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 结果处理 */}
      <div className="border-t border-gray-600 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-green-400 mb-2">
              ✓ 存在时 → 跳转到
            </label>
            <select
              value={config.existNodeId || ''}
              onChange={(e) => updateConfig('existNodeId', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            >
              <option value="">-- 通过连线指定 --</option>
              {availableNodes.map(n => (
                <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-red-400 mb-2">
              ✗ 不存在时 → 跳转到
            </label>
            <select
              value={config.notExistNodeId || ''}
              onChange={(e) => updateConfig('notExistNodeId', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            >
              <option value="">-- 通过连线指定 --</option>
              {availableNodes.map(n => (
                <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">📖 使用说明</h4>
        <div className="text-xs text-gray-400 space-y-1">
          <p>1. <span className="text-blue-300">校验对象</span>：选择要检查的数据来源（来自前面节点的输出）</p>
          <p>2. <span className="text-green-300">目标表单</span>：选择要在哪个表单中查找</p>
          <p>3. <span className="text-white">匹配规则</span>：设置如何判断记录是否"存在"</p>
        </div>
        <h4 className="text-sm font-medium text-gray-300 mt-3 mb-2">💡 常见场景</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• 注册时检查用户名是否已被占用</li>
          <li>• 下单前检查商品是否存在</li>
          <li>• 检查订单号是否重复</li>
        </ul>
      </div>
    </div>
  );
}

window.ExistCheckConfigForm = ExistCheckConfigForm;
