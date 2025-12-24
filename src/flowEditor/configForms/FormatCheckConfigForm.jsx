// 格式校验节点配置表单
// 已集成变量管理：校验目标可从变量管理选择
function FormatCheckConfigForm({ 
  node, 
  nodes, 
  onUpdate,
  // 变量管理相关参数
  projectId,
  flowId,
  forms
}) {
  const config = node.config || {};
  const rules = config.rules || [];
  
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
  
  const updateConfig = (key, value) => {
    onUpdate({
      config: { ...config, [key]: value }
    });
  };

  // 校验规则类型
  const ruleTypes = [
    { value: 'required', label: '非空', desc: '不能为空' },
    { value: 'phone', label: '手机格式', desc: '11位手机号' },
    { value: 'email', label: '邮箱格式', desc: '有效邮箱地址' },
    { value: 'idCard', label: '身份证格式', desc: '18位身份证号' },
    { value: 'number', label: '数值范围', desc: '数字比较' },
    { value: 'length', label: '文本长度', desc: '最小/最大长度' },
    { value: 'regex', label: '正则表达式', desc: '自定义正则' }
  ];

  // 添加规则
  const addRule = () => {
    updateConfig('rules', [
      ...rules,
      { 
        id: Date.now(), 
        target: '', 
        ruleType: 'required', 
        params: {}, 
        errorMsg: '',
        variableId: '',
        variablePath: ''
      }
    ]);
  };

  // 更新规则
  const updateRule = (index, updates) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], ...updates };
    updateConfig('rules', newRules);
  };

  // 删除规则
  const removeRule = (index) => {
    updateConfig('rules', rules.filter((_, i) => i !== index));
  };

  // 选择变量时记录使用
  const handleSelectVariable = async (index, variableId) => {
    if (!variableId) {
      updateRule(index, { variableId: '', variablePath: '', target: '' });
      return;
    }

    // 记录变量使用
    if (node.id && flowId && projectId) {
      try {
        await window.dndDB.addVariableUsage(projectId, variableId, node.id, flowId);
      } catch (error) {
        console.error('记录变量使用失败:', error);
      }
    }

    updateRule(index, { variableId: variableId, variablePath: '', target: variableId });
  };

  // 获取变量的字段列表
  const getVariableFields = (variableId) => {
    if (!variableId || !variables || !forms) return [];
    const variable = variables.find(v => v.id === variableId);
    if (!variable || !variable.sourceFormId) return [];
    
    const form = forms.find(f => f.id === variable.sourceFormId);
    if (!form) return [];
    
    return form.structure?.fields || [];
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

  // 渲染规则参数
  const renderRuleParams = (rule, index) => {
    switch (rule.ruleType) {
      case 'number':
        return (
          <div className="flex items-center space-x-2 mt-2">
            <select
              value={rule.params?.operator || '>'}
              onChange={(e) => updateRule(index, { params: { ...rule.params, operator: e.target.value } })}
              className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs"
            >
              <option value=">">大于</option>
              <option value=">=">大于等于</option>
              <option value="<">小于</option>
              <option value="<=">小于等于</option>
              <option value="==">等于</option>
              <option value="!=">不等于</option>
            </select>
            <input
              type="number"
              value={rule.params?.value || ''}
              onChange={(e) => updateRule(index, { params: { ...rule.params, value: e.target.value } })}
              placeholder="数值"
              className="w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs"
            />
          </div>
        );
      case 'length':
        return (
          <div className="flex items-center space-x-2 mt-2">
            <input
              type="number"
              value={rule.params?.min || ''}
              onChange={(e) => updateRule(index, { params: { ...rule.params, min: e.target.value } })}
              placeholder="最小"
              className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              value={rule.params?.max || ''}
              onChange={(e) => updateRule(index, { params: { ...rule.params, max: e.target.value } })}
              placeholder="最大"
              className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs"
            />
            <span className="text-xs text-gray-500">字符</span>
          </div>
        );
      case 'regex':
        return (
          <div className="mt-2">
            <input
              type="text"
              value={rule.params?.pattern || ''}
              onChange={(e) => updateRule(index, { params: { ...rule.params, pattern: e.target.value } })}
              placeholder="正则表达式，如：^[A-Z]{2}\\d{6}$"
              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs font-mono"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* 校验规则列表 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          校验规则（全部通过才算通过）
        </label>
        
        {rules.length > 0 && (
          <div className="space-y-3 mb-3">
            {rules.map((rule, index) => (
              <div key={rule.id} className="bg-gray-700/50 border border-gray-600 rounded p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    {/* 序号和规则类型 */}
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <select
                        value={rule.ruleType}
                        onChange={(e) => updateRule(index, { ruleType: e.target.value, params: {} })}
                        className="w-28 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      >
                        {ruleTypes.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* 校验目标 - 集成变量管理 */}
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400">校验目标</label>
                      {loadingVars ? (
                        <div className="text-sm text-gray-400">加载中...</div>
                      ) : variables.length === 0 ? (
                        <input
                          type="text"
                          value={rule.target}
                          onChange={(e) => updateRule(index, { target: e.target.value })}
                          placeholder="校验目标，如：user.手机号"
                          className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        />
                      ) : (
                        <div className="space-y-2">
                          <select
                            value={rule.variableId || ''}
                            onChange={(e) => handleSelectVariable(index, e.target.value)}
                            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                          >
                            <option value="">-- 选择变量 --</option>
                            {variables.map(v => (
                              <option key={v.id} value={v.id}>
                                {v.id} {v.name ? `(${v.name})` : ''} [{getDataTypeText(v.dataType)}]
                              </option>
                            ))}
                          </select>
                          
                          {rule.variableId && (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-400">字段:</span>
                              {getVariableFields(rule.variableId).length > 0 ? (
                                <select
                                  value={rule.variablePath || ''}
                                  onChange={(e) => {
                                    const path = e.target.value;
                                    updateRule(index, { 
                                      variablePath: path,
                                      target: path ? `${rule.variableId}.${path}` : rule.variableId
                                    });
                                  }}
                                  className="flex-1 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-xs"
                                >
                                  <option value="">（整个变量）</option>
                                  {getVariableFields(rule.variableId).map(f => (
                                    <option key={f.id} value={f.id}>{f.name || f.id}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={rule.variablePath || ''}
                                  onChange={(e) => {
                                    const path = e.target.value;
                                    updateRule(index, { 
                                      variablePath: path,
                                      target: path ? `${rule.variableId}.${path}` : rule.variableId
                                    });
                                  }}
                                  placeholder="输入字段路径"
                                  className="flex-1 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-xs"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* 规则参数 */}
                    {renderRuleParams(rule, index)}
                    
                    {/* 错误提示 */}
                    <input
                      type="text"
                      value={rule.errorMsg}
                      onChange={(e) => updateRule(index, { errorMsg: e.target.value })}
                      placeholder="错误提示，如：手机号格式不正确"
                      className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    />
                  </div>
                  
                  <button
                    onClick={() => removeRule(index)}
                    className="text-red-400 hover:text-red-300 ml-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <button
          onClick={addRule}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          + 添加规则
        </button>
      </div>

      {/* 校验结果处理 */}
      <div className="border-t border-gray-600 pt-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-green-400 mb-2">
            ✓ 全部通过时 → 跳转到
          </label>
          <select
            value={config.passNodeId || ''}
            onChange={(e) => updateConfig('passNodeId', e.target.value)}
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
            ✗ 未通过时
          </label>
          <div className="space-y-2">
            <div className="flex items-center space-x-4">
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="radio"
                  checked={config.failMode !== 'all'}
                  onChange={() => updateConfig('failMode', 'first')}
                  className="mr-2"
                />
                提示第一条错误
              </label>
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="radio"
                  checked={config.failMode === 'all'}
                  onChange={() => updateConfig('failMode', 'all')}
                  className="mr-2"
                />
                提示所有错误
              </label>
            </div>
            <select
              value={config.failNodeId || ''}
              onChange={(e) => updateConfig('failNodeId', e.target.value)}
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
    </div>
  );
}

window.FormatCheckConfigForm = FormatCheckConfigForm;
