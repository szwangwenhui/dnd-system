// 字段映射器 - 通用组件
// 用于：写入、更新时的字段赋值
// 已集成变量管理：来源类型为"变量"时支持从变量管理选择
function FieldMapper({ 
  mappings, 
  onChange, 
  fields, 
  label, 
  showSource,
  // 变量管理相关参数
  projectId,
  flowId,
  nodeId,
  forms  // 用于获取变量的字段列表
}) {
  // 确保 mappings 是数组
  const currentMappings = Array.isArray(mappings) ? mappings : [];

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

  // 添加映射
  const addMapping = () => {
    const newMappings = [...currentMappings, {
      id: Date.now(),
      targetField: '',
      sourceType: 'fixed',
      sourceValue: '',
      // 变量管理相关字段
      variableId: '',
      variablePath: ''
    }];
    onChange(newMappings);
  };

  // 删除映射
  const removeMapping = (index) => {
    const newMappings = currentMappings.filter((_, i) => i !== index);
    onChange(newMappings);
  };

  // 更新映射
  const updateMapping = (index, updates) => {
    const newMappings = currentMappings.map((mapping, i) => 
      i === index ? { ...mapping, ...updates } : mapping
    );
    onChange(newMappings);
  };

  // 选择变量时记录使用
  const handleSelectVariable = async (index, variableId) => {
    if (!variableId) {
      updateMapping(index, { 
        variableId: '', 
        variablePath: '', 
        sourceValue: '' 
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

    updateMapping(index, { 
      variableId: variableId, 
      variablePath: '', 
      sourceValue: variableId  // 兼容旧版
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
        <label className="text-sm font-medium text-gray-300">{label || '字段映射'}</label>
        <button
          onClick={addMapping}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
        >
          <span>+</span>
          <span>添加字段</span>
        </button>
      </div>

      {currentMappings.length === 0 ? (
        <div className="text-xs text-gray-500 bg-gray-700 rounded p-3 text-center">
          点击"添加字段"设置要写入的字段
        </div>
      ) : (
        <div className="space-y-2">
          {currentMappings.map((mapping, index) => (
            <div key={mapping.id || index} className="bg-gray-700 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">字段 {index + 1}</span>
                <button
                  onClick={() => removeMapping(index)}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  删除
                </button>
              </div>
              
              <div className="space-y-2">
                {/* 目标字段 */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">目标字段</label>
                  <select
                    value={mapping.targetField}
                    onChange={(e) => updateMapping(index, { targetField: e.target.value })}
                    className="w-full bg-gray-600 text-gray-200 rounded px-2 py-1.5 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">选择字段</option>
                    {fields?.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* 数据来源 */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">数据来源</label>
                  <div className="flex space-x-2">
                    <select
                      value={mapping.sourceType}
                      onChange={(e) => updateMapping(index, { 
                        sourceType: e.target.value, 
                        sourceValue: '',
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
                    {mapping.sourceType === 'fixed' && (
                      <input
                        type="text"
                        value={mapping.sourceValue}
                        onChange={(e) => updateMapping(index, { sourceValue: e.target.value })}
                        placeholder="输入固定值"
                        className="flex-1 bg-gray-600 text-gray-200 rounded px-2 py-1.5 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
                      />
                    )}
                    
                    {/* 系统值选择 */}
                    {mapping.sourceType === 'system' && (
                      <select
                        value={mapping.sourceValue}
                        onChange={(e) => updateMapping(index, { sourceValue: e.target.value })}
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
                  {mapping.sourceType === 'variable' && (
                    <div className="mt-2 space-y-2">
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
                            value={mapping.variableId || ''}
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

                          {/* 如果选中了变量，显示字段选择 */}
                          {mapping.variableId && (
                            <div className="flex space-x-2 items-center">
                              <span className="text-xs text-gray-400">字段:</span>
                              {getVariableFields(mapping.variableId).length > 0 ? (
                                <select
                                  value={mapping.variablePath || ''}
                                  onChange={(e) => {
                                    const path = e.target.value;
                                    updateMapping(index, { 
                                      variablePath: path,
                                      sourceValue: path ? `${mapping.variableId}.${path}` : mapping.variableId
                                    });
                                  }}
                                  className="flex-1 bg-gray-600 text-gray-200 rounded px-2 py-1.5 text-sm border border-gray-500"
                                >
                                  <option value="">（整个变量）</option>
                                  {getVariableFields(mapping.variableId).map(f => (
                                    <option key={f.id} value={f.id}>{f.name || f.id}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={mapping.variablePath || ''}
                                  onChange={(e) => {
                                    const path = e.target.value;
                                    updateMapping(index, { 
                                      variablePath: path,
                                      sourceValue: path ? `${mapping.variableId}.${path}` : mapping.variableId
                                    });
                                  }}
                                  placeholder="输入字段路径，如 name"
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
              </div>
              
              {/* 映射预览 */}
              {mapping.targetField && (
                <div className="text-xs text-green-400 bg-green-900/20 rounded p-1.5 mt-1">
                  {fields?.find(f => f.id === mapping.targetField)?.name || mapping.targetField} ← {
                    mapping.sourceType === 'variable' 
                      ? `{${mapping.variableId}${mapping.variablePath ? '.' + mapping.variablePath : ''}}` 
                      : mapping.sourceType === 'system' 
                        ? mapping.sourceValue 
                        : `"${mapping.sourceValue}"`
                  }
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

window.FieldMapper = FieldMapper;
