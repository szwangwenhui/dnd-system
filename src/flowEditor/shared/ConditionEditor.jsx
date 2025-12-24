// 条件编辑器 - 通用组件
// 用于：读取筛选、更新定位、删除定位、存在性校验等
// 已集成变量管理：值类型为"变量"时支持从变量管理选择
function ConditionEditor({ 
  conditions, 
  onChange, 
  fields, 
  label,
  // 变量管理相关参数
  projectId,
  flowId,
  nodeId,
  forms  // 用于获取变量的字段列表
}) {
  // 确保 conditions 是数组
  const currentConditions = Array.isArray(conditions) ? conditions : [];

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

  // 运算符列表
  const operators = [
    { value: '==', label: '等于' },
    { value: '!=', label: '不等于' },
    { value: '>', label: '大于' },
    { value: '>=', label: '大于等于' },
    { value: '<', label: '小于' },
    { value: '<=', label: '小于等于' },
    { value: 'contains', label: '包含' },
    { value: 'startsWith', label: '开头是' },
    { value: 'endsWith', label: '结尾是' },
    { value: 'isEmpty', label: '为空' },
    { value: 'isNotEmpty', label: '不为空' }
  ];

  // 添加条件
  const addCondition = () => {
    const newConditions = [...currentConditions, {
      id: Date.now(),
      field: '',
      operator: '==',
      valueType: 'fixed',
      value: '',
      // 变量管理相关字段
      variableId: '',
      variablePath: ''
    }];
    onChange(newConditions);
  };

  // 删除条件
  const removeCondition = (index) => {
    const newConditions = currentConditions.filter((_, i) => i !== index);
    onChange(newConditions);
  };

  // 更新条件
  const updateCondition = (index, updates) => {
    const newConditions = currentConditions.map((cond, i) => 
      i === index ? { ...cond, ...updates } : cond
    );
    onChange(newConditions);
  };

  // 选择变量时记录使用
  const handleSelectVariable = async (index, variableId) => {
    if (!variableId) {
      updateCondition(index, { 
        variableId: '', 
        variablePath: '', 
        value: '' 
      });
      return;
    }

    // 记录变量使用
    if (nodeId && flowId && projectId) {
      try {
        await window.dndDB.addVariableUsage(projectId, variableId, nodeId, flowId);
      } catch (error) {
        console.error('记录变量使用失败:', error);
      }
    }

    updateCondition(index, { 
      variableId: variableId, 
      variablePath: '', 
      value: variableId  // 兼容旧版
    });
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">{label || '筛选条件'}</label>
        <button
          onClick={addCondition}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
        >
          <span>+</span>
          <span>添加条件</span>
        </button>
      </div>

      {currentConditions.length === 0 ? (
        <div className="text-xs text-gray-500 bg-gray-700 rounded p-3 text-center">
          暂无筛选条件，将匹配所有记录
        </div>
      ) : (
        <div className="space-y-2">
          {currentConditions.map((cond, index) => (
            <div key={cond.id || index} className="bg-gray-700 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">条件 {index + 1}</span>
                <button
                  onClick={() => removeCondition(index)}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  删除
                </button>
              </div>
              
              {/* 字段和运算符 */}
              <div className="grid grid-cols-2 gap-2">
                {/* 字段选择 */}
                <select
                  value={cond.field}
                  onChange={(e) => updateCondition(index, { field: e.target.value })}
                  className="bg-gray-600 text-gray-200 rounded px-2 py-1.5 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">选择字段</option>
                  {fields?.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>

                {/* 运算符选择 */}
                <select
                  value={cond.operator}
                  onChange={(e) => updateCondition(index, { operator: e.target.value })}
                  className="bg-gray-600 text-gray-200 rounded px-2 py-1.5 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
                >
                  {operators.map(op => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
              </div>

              {/* 值类型和值（非空运算符不需要值） */}
              {!['isEmpty', 'isNotEmpty'].includes(cond.operator) && (
                <div className="space-y-2">
                  {/* 值类型选择 */}
                  <div className="flex space-x-2">
                    <select
                      value={cond.valueType}
                      onChange={(e) => updateCondition(index, { 
                        valueType: e.target.value, 
                        value: '',
                        variableId: '',
                        variablePath: ''
                      })}
                      className="w-24 bg-gray-600 text-gray-200 rounded px-2 py-1.5 text-sm border border-gray-500"
                    >
                      <option value="fixed">固定值</option>
                      <option value="variable">变量</option>
                      <option value="system">系统值</option>
                    </select>
                    
                    {/* 固定值输入 */}
                    {cond.valueType === 'fixed' && (
                      <input
                        type="text"
                        value={cond.value}
                        onChange={(e) => updateCondition(index, { value: e.target.value })}
                        placeholder="输入值"
                        className="flex-1 bg-gray-600 text-gray-200 rounded px-2 py-1.5 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
                      />
                    )}
                    
                    {/* 系统值选择 */}
                    {cond.valueType === 'system' && (
                      <select
                        value={cond.value}
                        onChange={(e) => updateCondition(index, { value: e.target.value })}
                        className="flex-1 bg-gray-600 text-gray-200 rounded px-2 py-1.5 text-sm border border-gray-500"
                      >
                        <option value="">选择系统值</option>
                        <option value="@NOW">@NOW - 当前时间</option>
                        <option value="@TODAY">@TODAY - 当前日期</option>
                        <option value="@USER">@USER - 当前用户ID</option>
                        <option value="@USERNAME">@USERNAME - 当前用户名</option>
                      </select>
                    )}
                  </div>

                  {/* 变量选择 - 集成变量管理 */}
                  {cond.valueType === 'variable' && (
                    <div className="space-y-2">
                      {loadingVars ? (
                        <div className="text-sm text-gray-400">加载中...</div>
                      ) : variables.length === 0 ? (
                        <div className="bg-gray-600 rounded p-2 text-xs text-gray-400 text-center">
                          暂无可用变量，请先在读取节点中创建变量
                        </div>
                      ) : (
                        <>
                          {/* 选择变量 */}
                          <select
                            value={cond.variableId || ''}
                            onChange={(e) => handleSelectVariable(index, e.target.value)}
                            className="w-full bg-gray-600 text-gray-200 rounded px-2 py-1.5 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
                          >
                            <option value="">-- 选择变量 --</option>
                            {variables.map(v => (
                              <option key={v.id} value={v.id}>
                                {v.id} {v.name ? `(${v.name})` : ''} [{getDataTypeText(v.dataType)}]
                              </option>
                            ))}
                          </select>

                          {/* 如果选中了变量且是对象/数组类型，显示字段选择 */}
                          {cond.variableId && (
                            <div className="flex space-x-2 items-center">
                              <span className="text-xs text-gray-400">字段:</span>
                              {getVariableFields(cond.variableId).length > 0 ? (
                                <select
                                  value={cond.variablePath || ''}
                                  onChange={(e) => {
                                    const path = e.target.value;
                                    updateCondition(index, { 
                                      variablePath: path,
                                      value: path ? `${cond.variableId}.${path}` : cond.variableId
                                    });
                                  }}
                                  className="flex-1 bg-gray-600 text-gray-200 rounded px-2 py-1.5 text-sm border border-gray-500"
                                >
                                  <option value="">（整个变量）</option>
                                  {getVariableFields(cond.variableId).map(f => (
                                    <option key={f.id} value={f.id}>{f.name || f.id}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={cond.variablePath || ''}
                                  onChange={(e) => {
                                    const path = e.target.value;
                                    updateCondition(index, { 
                                      variablePath: path,
                                      value: path ? `${cond.variableId}.${path}` : cond.variableId
                                    });
                                  }}
                                  placeholder="输入字段路径，如 id"
                                  className="flex-1 bg-gray-600 text-gray-200 rounded px-2 py-1.5 text-sm border border-gray-500"
                                />
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* 条件预览 */}
              {cond.field && (
                <div className="text-xs text-gray-400 mt-1">
                  预览：{fields?.find(f => f.id === cond.field)?.name || cond.field} {
                    operators.find(o => o.value === cond.operator)?.label
                  } {!['isEmpty', 'isNotEmpty'].includes(cond.operator) && (
                    cond.valueType === 'variable' 
                      ? `{${cond.variableId}${cond.variablePath ? '.' + cond.variablePath : ''}}` 
                      : cond.valueType === 'system' 
                        ? cond.value 
                        : `"${cond.value}"`
                  )}
                </div>
              )}
            </div>
          ))}

          {/* 多条件关系说明 */}
          {currentConditions.length > 1 && (
            <div className="text-xs text-gray-500 text-center">
              多个条件之间为 AND 关系（同时满足）
            </div>
          )}
        </div>
      )}
    </div>
  );
}

window.ConditionEditor = ConditionEditor;
