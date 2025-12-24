// 写入节点配置表单
// 支持三种写入模式：批量写入、逐条写入、单元格更新
function WriteNodeConfigForm({ config, onChange, projectId, flowId, flowName, nodeId, forms, fields, pages, blocks }) {
  const defaultConfig = {
    formId: '',
    formName: '',
    writeMode: 'single',  // batch=批量写入, single=逐条写入, cell=单元格更新
    // 批量写入配置
    batchConfig: {
      sourceVarId: '',
      sourceVarName: '',
      primaryKeyMode: 'source',  // source=来自源数据, auto=自动自增
      fieldMappings: []
    },
    // 逐条写入配置
    singleConfig: {
      subMode: 'mapping',  // direct=整体写入, mapping=映射写入
      sourceVarId: '',     // 整体写入时的源变量（通常是$item）
      fieldValues: []      // 映射写入时的字段配置
    },
    // 单元格更新配置
    cellConfig: {
      primaryKey: {
        mode: 'static',
        staticValue: '',
        dynamicType: 'variable',
        dynamicValue: { variable: '', varPath: '', pageId: '', blockId: '', urlParam: '' }
      },
      targetField: '',
      valueType: 'fixed',  // fixed/variable/system
      value: '',
      varId: '',
      varPath: ''
    }
  };

  const [localConfig, setLocalConfig] = React.useState({
    ...defaultConfig,
    ...config,
    batchConfig: { ...defaultConfig.batchConfig, ...(config?.batchConfig || {}) },
    singleConfig: { ...defaultConfig.singleConfig, ...(config?.singleConfig || {}) },
    cellConfig: { 
      ...defaultConfig.cellConfig, 
      ...(config?.cellConfig || {}), 
      primaryKey: { ...defaultConfig.cellConfig.primaryKey, ...(config?.cellConfig?.primaryKey || {}) }
    }
  });

  // 变量相关状态
  const [flowVariables, setFlowVariables] = React.useState([]);
  const [loadingVars, setLoadingVars] = React.useState(false);

  // 加载流程变量（修复：正确加载方法 + 添加循环变量）
  React.useEffect(() => {
    if (projectId && flowId) {
      loadVariables();
    }
  }, [projectId, flowId]);

  const loadVariables = async () => {
    setLoadingVars(true);
    try {
      const allVars = await window.dndDB.getVariables(projectId);
      const vars = (allVars || []).filter(v => v.flowId === flowId);
      setFlowVariables(vars);
    } catch (error) {
      console.error('加载变量列表失败:', error);
    } finally {
      setLoadingVars(false);
    }
  };

  // 获取所有可用变量（流程变量 + 循环变量）
  const getAllVariables = () => {
    const vars = [...flowVariables];
    // 添加循环变量
    vars.push(
      { id: '$item', name: '当前项（循环）', dataType: 'object', isLoopVar: true },
      { id: '$index', name: '循环索引', dataType: 'number', isLoopVar: true }
    );
    return vars;
  };

  // 获取变量的属性列表（用于对象类型变量）
  const getVarPaths = (varId) => {
    if (!varId) return [];
    
    const variable = getAllVariables().find(v => v.id === varId);
    if (!variable) return [];
    
    // 如果是循环变量$item，从数组变量的源表单获取字段
    if (varId === '$item') {
      const arrayVar = flowVariables.find(v => v.dataType === 'array');
      if (arrayVar && arrayVar.sourceFormId) {
        const formFields = fields?.filter(f => f.formId === arrayVar.sourceFormId) || [];
        return formFields.map(f => ({ id: f.id, name: f.name }));
      }
    }
    
    // 如果是对象变量，从源表单获取字段
    if (variable.dataType === 'object' && variable.sourceFormId) {
      const formFields = fields?.filter(f => f.formId === variable.sourceFormId) || [];
      return formFields.map(f => ({ id: f.id, name: f.name }));
    }
    
    return [];
  };

  const updateConfig = (path, value) => {
    setLocalConfig(prev => {
      const newConfig = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = newConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      onChange(newConfig);
      return newConfig;
    });
  };

  // 获取目标表单的字段
  const getTargetFormFields = () => {
    if (!localConfig.formId || !fields) return [];
    return fields.filter(f => f.formId === localConfig.formId);
  };

  // 获取目标表单的主键字段
  const getPrimaryKeyField = () => {
    const targetFields = getTargetFormFields();
    const form = forms?.find(f => f.id === localConfig.formId);
    if (form && form.structure && form.structure.fields) {
      const pkFieldDef = form.structure.fields.find(f => f.isPrimary);
      if (pkFieldDef) {
        return targetFields.find(f => f.id === pkFieldDef.fieldId);
      }
    }
    return null;
  };

  // 获取非主键字段
  const getNonPrimaryFields = () => {
    const pkField = getPrimaryKeyField();
    return getTargetFormFields().filter(f => f.id !== pkField?.id);
  };

  const targetFormFields = getTargetFormFields();
  const primaryKeyField = getPrimaryKeyField();
  const nonPrimaryFields = getNonPrimaryFields();

  // ========== 逐条写入：字段值设置 ==========
  const addFieldValue = () => {
    const newValues = [...(localConfig.singleConfig.fieldValues || []), {
      id: Date.now(),
      targetFieldId: '',
      targetFieldName: '',
      valueType: 'constant',  // constant/variable/varPath/system
      value: '',
      varId: '',
      varPath: ''
    }];
    updateConfig('singleConfig.fieldValues', newValues);
  };

  const removeFieldValue = (index) => {
    const newValues = (localConfig.singleConfig.fieldValues || []).filter((_, i) => i !== index);
    updateConfig('singleConfig.fieldValues', newValues);
  };

  const updateFieldValue = (index, updates) => {
    const newValues = (localConfig.singleConfig.fieldValues || []).map((fv, i) => 
      i === index ? { ...fv, ...updates } : fv
    );
    updateConfig('singleConfig.fieldValues', newValues);
  };

  // ========== 批量写入：字段映射 ==========
  const addBatchMapping = () => {
    const newMappings = [...(localConfig.batchConfig.fieldMappings || []), {
      id: Date.now(),
      sourceFieldId: '',
      sourceFieldName: '',
      targetFieldId: '',
      targetFieldName: '',
      valueType: 'variable',
      fixedValue: ''
    }];
    updateConfig('batchConfig.fieldMappings', newMappings);
  };

  const removeBatchMapping = (index) => {
    const newMappings = (localConfig.batchConfig.fieldMappings || []).filter((_, i) => i !== index);
    updateConfig('batchConfig.fieldMappings', newMappings);
  };

  const updateBatchMapping = (index, updates) => {
    const newMappings = (localConfig.batchConfig.fieldMappings || []).map((m, i) => 
      i === index ? { ...m, ...updates } : m
    );
    updateConfig('batchConfig.fieldMappings', newMappings);
  };

  // 获取源变量的字段（用于批量写入的字段映射）
  const getSourceVarFields = () => {
    const sourceVarId = localConfig.batchConfig.sourceVarId;
    if (!sourceVarId) return [];
    
    const sourceVar = flowVariables.find(v => v.id === sourceVarId);
    if (!sourceVar || !sourceVar.sourceFormId) return [];
    
    return fields?.filter(f => f.formId === sourceVar.sourceFormId) || [];
  };

  // ========== 渲染变量选择下拉 ==========
  const renderVarSelect = (value, onChange, placeholder = '选择变量', filterFn = null) => {
    let vars = getAllVariables();
    if (filterFn) {
      vars = vars.filter(filterFn);
    }
    
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
      >
        <option value="">{placeholder}</option>
        <optgroup label="🔄 循环变量">
          {vars.filter(v => v.isLoopVar).map(v => (
            <option key={v.id} value={v.id}>{v.id} ({v.name})</option>
          ))}
        </optgroup>
        {vars.filter(v => !v.isLoopVar).length > 0 && (
          <optgroup label="📊 流程变量">
            {vars.filter(v => !v.isLoopVar).map(v => (
              <option key={v.id} value={v.id}>{v.id} ({v.name || '未命名'})</option>
            ))}
          </optgroup>
        )}
      </select>
    );
  };

  // 获取数据类型显示文本
  const getDataTypeText = (type) => {
    switch (type) {
      case 'array': return '数组';
      case 'object': return '对象';
      case 'value': return '单值';
      case 'number': return '数字';
      case 'string': return '文本';
      default: return type || '未知';
    }
  };

  return (
    <div className="space-y-4">
      {/* 选择目标表单 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">写入目标表单</label>
        <select
          value={localConfig.formId}
          onChange={(e) => {
            const form = forms?.find(f => f.id === e.target.value);
            updateConfig('formId', e.target.value);
            updateConfig('formName', form?.name || '');
            // 清空配置
            updateConfig('batchConfig.fieldMappings', []);
            updateConfig('singleConfig.fieldValues', []);
          }}
          className="w-full bg-gray-700 text-gray-200 rounded px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
        >
          <option value="">-- 选择表单 --</option>
          {forms?.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {localConfig.formId && (
        <>
          {/* 显示主键信息 */}
          {primaryKeyField && (
            <div className="text-xs text-gray-400 bg-gray-700/50 rounded p-2">
              主键字段：<span className="text-blue-400">{primaryKeyField.name}</span>
              <span className="text-gray-500 ml-1">({primaryKeyField.type})</span>
            </div>
          )}

          {/* 写入模式选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">写入模式</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => updateConfig('writeMode', 'batch')}
                className={`p-3 rounded-lg border text-left ${
                  localConfig.writeMode === 'batch'
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                }`}
              >
                <div className="text-sm font-medium text-gray-200">批量写入</div>
                <div className="text-xs text-gray-400 mt-1">一次写入多条</div>
              </button>
              <button
                onClick={() => updateConfig('writeMode', 'single')}
                className={`p-3 rounded-lg border text-left ${
                  localConfig.writeMode === 'single'
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                }`}
              >
                <div className="text-sm font-medium text-gray-200">逐条写入</div>
                <div className="text-xs text-gray-400 mt-1">循环中使用</div>
              </button>
              <button
                onClick={() => updateConfig('writeMode', 'cell')}
                className={`p-3 rounded-lg border text-left ${
                  localConfig.writeMode === 'cell'
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                }`}
              >
                <div className="text-sm font-medium text-gray-200">单元格更新</div>
                <div className="text-xs text-gray-400 mt-1">改已有记录</div>
              </button>
            </div>
          </div>

          {/* ===== 批量写入模式 ===== */}
          {localConfig.writeMode === 'batch' && (
            <div className="bg-gray-700 rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-medium text-gray-300">批量写入配置</h4>
              
              {/* 选择数据来源变量 */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">数据来源（数组变量）</label>
                {loadingVars ? (
                  <div className="text-sm text-gray-400">加载变量中...</div>
                ) : (
                  <select
                    value={localConfig.batchConfig.sourceVarId}
                    onChange={(e) => {
                      const v = flowVariables.find(v => v.id === e.target.value);
                      updateConfig('batchConfig.sourceVarId', e.target.value);
                      updateConfig('batchConfig.sourceVarName', v?.name || '');
                      updateConfig('batchConfig.fieldMappings', []);
                    }}
                    className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- 选择数组变量 --</option>
                    {flowVariables.filter(v => v.dataType === 'array').map(v => (
                      <option key={v.id} value={v.id}>
                        {v.id} ({v.name || v.sourceFormName || '未命名'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 主键处理 */}
              {localConfig.batchConfig.sourceVarId && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">主键处理</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={localConfig.batchConfig.primaryKeyMode === 'source'}
                        onChange={() => updateConfig('batchConfig.primaryKeyMode', 'source')}
                        className="text-blue-500"
                      />
                      <span className="text-gray-300 text-sm">来自源数据</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={localConfig.batchConfig.primaryKeyMode === 'auto'}
                        onChange={() => updateConfig('batchConfig.primaryKeyMode', 'auto')}
                        className="text-blue-500"
                      />
                      <span className="text-gray-300 text-sm">自动自增</span>
                    </label>
                  </div>
                </div>
              )}

              {/* 字段映射 */}
              {localConfig.batchConfig.sourceVarId && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-400">字段映射</label>
                    <button
                      onClick={addBatchMapping}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      + 添加映射
                    </button>
                  </div>

                  {(localConfig.batchConfig.fieldMappings || []).length === 0 ? (
                    <div className="text-xs text-gray-500 bg-gray-600 rounded p-3 text-center">
                      点击"添加映射"建立字段对应关系
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(localConfig.batchConfig.fieldMappings || []).map((mapping, index) => (
                        <div key={mapping.id || index} className="bg-gray-600 rounded p-2 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">映射 {index + 1}</span>
                            <button
                              onClick={() => removeBatchMapping(index)}
                              className="text-red-400 hover:text-red-300 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={mapping.sourceFieldId}
                              onChange={(e) => {
                                const f = getSourceVarFields().find(f => f.id === e.target.value);
                                updateBatchMapping(index, { sourceFieldId: e.target.value, sourceFieldName: f?.name || '' });
                              }}
                              className="flex-1 bg-gray-500 text-gray-200 rounded px-2 py-1.5 text-xs border border-gray-400"
                            >
                              <option value="">源字段</option>
                              {getSourceVarFields().map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                              ))}
                            </select>
                            <span className="text-gray-400">→</span>
                            <select
                              value={mapping.targetFieldId}
                              onChange={(e) => {
                                const f = targetFormFields.find(f => f.id === e.target.value);
                                updateBatchMapping(index, { targetFieldId: e.target.value, targetFieldName: f?.name || '' });
                              }}
                              className="flex-1 bg-gray-500 text-gray-200 rounded px-2 py-1.5 text-xs border border-gray-400"
                            >
                              <option value="">目标字段</option>
                              {targetFormFields.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===== 逐条写入模式 ===== */}
          {localConfig.writeMode === 'single' && (
            <div className="bg-gray-700 rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-medium text-gray-300">逐条写入配置</h4>
              
              {/* 主键说明 */}
              <div className="bg-blue-900/30 border border-blue-700 rounded p-3">
                <div className="text-xs text-blue-300">
                  <strong>主键（{primaryKeyField?.name || '未知'}）</strong>：自动自增
                </div>
                <div className="text-xs text-blue-400 mt-1">
                  系统将自动获取最大值+1，空表从1开始
                </div>
              </div>

              {/* 子模式选择 */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">写入方式</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={localConfig.singleConfig.subMode === 'direct'}
                      onChange={() => updateConfig('singleConfig.subMode', 'direct')}
                      className="text-blue-500"
                    />
                    <span className="text-gray-300 text-sm">整体写入</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={localConfig.singleConfig.subMode !== 'direct'}
                      onChange={() => updateConfig('singleConfig.subMode', 'mapping')}
                      className="text-blue-500"
                    />
                    <span className="text-gray-300 text-sm">映射写入</span>
                  </label>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {localConfig.singleConfig.subMode === 'direct' 
                    ? '整体写入：将变量所有字段直接写入（要求字段名一致）'
                    : '映射写入：手动配置每个字段的取值'}
                </div>
              </div>

              {/* 整体写入子模式 */}
              {localConfig.singleConfig.subMode === 'direct' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">数据来源变量</label>
                    <select
                      value={localConfig.singleConfig.sourceVarId || ''}
                      onChange={(e) => updateConfig('singleConfig.sourceVarId', e.target.value)}
                      className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">-- 选择变量 --</option>
                      <optgroup label="🔄 循环变量">
                        <option value="$item">$item (当前项)</option>
                      </optgroup>
                      {flowVariables.filter(v => v.dataType === 'object').length > 0 && (
                        <optgroup label="📊 对象变量">
                          {flowVariables.filter(v => v.dataType === 'object').map(v => (
                            <option key={v.id} value={v.id}>{v.id} ({v.name || '未命名'})</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                  <p className="text-xs text-yellow-400">
                    ⚠️ 整体写入要求变量的字段ID与目标表单字段ID完全一致
                  </p>
                </div>
              )}

              {/* 映射写入子模式 */}
              {localConfig.singleConfig.subMode !== 'direct' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-400">字段值设置（非主键字段）</label>
                    <button
                      onClick={addFieldValue}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      + 添加字段
                    </button>
                  </div>

                  {(localConfig.singleConfig.fieldValues || []).length === 0 ? (
                    <div className="text-xs text-gray-500 bg-gray-600 rounded p-3 text-center">
                      点击"添加字段"设置要写入的字段值
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(localConfig.singleConfig.fieldValues || []).map((fv, index) => (
                        <div key={fv.id || index} className="bg-gray-600 rounded p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">字段 {index + 1}</span>
                            <button
                              onClick={() => removeFieldValue(index)}
                              className="text-red-400 hover:text-red-300 text-xs"
                            >
                              ✕
                            </button>
                          </div>

                          {/* 选择目标字段 */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">目标字段</label>
                            <select
                              value={fv.targetFieldId}
                              onChange={(e) => {
                                const f = nonPrimaryFields.find(f => f.id === e.target.value);
                                updateFieldValue(index, { targetFieldId: e.target.value, targetFieldName: f?.name || '' });
                              }}
                              className="w-full bg-gray-500 text-gray-200 rounded px-2 py-1.5 text-xs border border-gray-400"
                            >
                              <option value="">-- 选择字段 --</option>
                              {nonPrimaryFields.map(f => (
                                <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
                              ))}
                            </select>
                          </div>

                          {/* 取值方式 */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">取值方式</label>
                            <div className="flex space-x-2 text-xs">
                              <label className="flex items-center space-x-1 cursor-pointer">
                                <input
                                  type="radio"
                                  checked={fv.valueType === 'constant'}
                                  onChange={() => updateFieldValue(index, { valueType: 'constant', varId: '', varPath: '' })}
                                  className="text-blue-500"
                                />
                                <span className="text-gray-300">常量</span>
                              </label>
                              <label className="flex items-center space-x-1 cursor-pointer">
                                <input
                                  type="radio"
                                  checked={fv.valueType === 'variable'}
                                  onChange={() => updateFieldValue(index, { valueType: 'variable', value: '' })}
                                  className="text-blue-500"
                                />
                                <span className="text-gray-300">变量</span>
                              </label>
                              <label className="flex items-center space-x-1 cursor-pointer">
                                <input
                                  type="radio"
                                  checked={fv.valueType === 'varPath'}
                                  onChange={() => updateFieldValue(index, { valueType: 'varPath', value: '' })}
                                  className="text-blue-500"
                                />
                                <span className="text-gray-300">变量.属性</span>
                              </label>
                              <label className="flex items-center space-x-1 cursor-pointer">
                                <input
                                  type="radio"
                                  checked={fv.valueType === 'system'}
                                  onChange={() => updateFieldValue(index, { valueType: 'system', varId: '', varPath: '' })}
                                  className="text-blue-500"
                                />
                                <span className="text-gray-300">系统值</span>
                              </label>
                            </div>
                          </div>

                          {/* 值输入 */}
                          <div>
                            {fv.valueType === 'constant' && (
                              <input
                                type="text"
                                value={fv.value || ''}
                                onChange={(e) => updateFieldValue(index, { value: e.target.value })}
                                placeholder="输入固定值"
                                className="w-full bg-gray-500 text-gray-200 rounded px-2 py-1.5 text-xs border border-gray-400"
                              />
                            )}

                            {fv.valueType === 'variable' && (
                              renderVarSelect(fv.varId, (v) => updateFieldValue(index, { varId: v }), '选择变量')
                            )}

                            {fv.valueType === 'varPath' && (
                              <div className="flex items-center gap-2">
                                <select
                                  value={fv.varId || ''}
                                  onChange={(e) => updateFieldValue(index, { varId: e.target.value, varPath: '' })}
                                  className="flex-1 bg-gray-500 text-gray-200 rounded px-2 py-1.5 text-xs border border-gray-400"
                                >
                                  <option value="">选择变量</option>
                                  <optgroup label="🔄 循环变量">
                                    <option value="$item">$item (当前项)</option>
                                  </optgroup>
                                  {flowVariables.filter(v => v.dataType === 'object').length > 0 && (
                                    <optgroup label="📊 对象变量">
                                      {flowVariables.filter(v => v.dataType === 'object').map(v => (
                                        <option key={v.id} value={v.id}>{v.id} ({v.name || '未命名'})</option>
                                      ))}
                                    </optgroup>
                                  )}
                                </select>
                                <span className="text-gray-400">.</span>
                                <select
                                  value={fv.varPath || ''}
                                  onChange={(e) => updateFieldValue(index, { varPath: e.target.value })}
                                  className="flex-1 bg-gray-500 text-gray-200 rounded px-2 py-1.5 text-xs border border-gray-400"
                                >
                                  <option value="">选择属性</option>
                                  {getVarPaths(fv.varId).map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {fv.valueType === 'system' && (
                              <select
                                value={fv.value || ''}
                                onChange={(e) => updateFieldValue(index, { value: e.target.value })}
                                className="w-full bg-gray-500 text-gray-200 rounded px-2 py-1.5 text-xs border border-gray-400"
                              >
                                <option value="">选择系统值</option>
                                <option value="@NOW">@NOW - 当前时间</option>
                                <option value="@TODAY">@TODAY - 当前日期</option>
                                <option value="@USER">@USER - 当前用户</option>
                              </select>
                            )}
                          </div>

                          {/* 预览 */}
                          {fv.targetFieldId && (
                            <div className="text-xs text-green-400">
                              ✓ {fv.targetFieldName} = {
                                fv.valueType === 'constant' ? `"${fv.value || ''}"` :
                                fv.valueType === 'variable' ? `$${fv.varId || '?'}` :
                                fv.valueType === 'varPath' ? `$${fv.varId || '?'}.${fv.varPath || '?'}` :
                                fv.value || '?'
                              }
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===== 单元格更新模式 ===== */}
          {localConfig.writeMode === 'cell' && (
            <div className="bg-gray-700 rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-medium text-gray-300">单元格更新配置</h4>
              
              {/* 主键定位 */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">定位记录（主键值）</label>
                <div className="flex space-x-2 mb-2">
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      checked={localConfig.cellConfig.primaryKey.mode === 'static'}
                      onChange={() => updateConfig('cellConfig.primaryKey.mode', 'static')}
                      className="text-blue-500"
                    />
                    <span className="text-gray-300 text-sm">静态值</span>
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      checked={localConfig.cellConfig.primaryKey.mode === 'dynamic'}
                      onChange={() => updateConfig('cellConfig.primaryKey.mode', 'dynamic')}
                      className="text-blue-500"
                    />
                    <span className="text-gray-300 text-sm">动态值</span>
                  </label>
                </div>

                {localConfig.cellConfig.primaryKey.mode === 'static' ? (
                  <input
                    type="text"
                    value={localConfig.cellConfig.primaryKey.staticValue || ''}
                    onChange={(e) => updateConfig('cellConfig.primaryKey.staticValue', e.target.value)}
                    placeholder="输入主键值"
                    className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500"
                  />
                ) : (
                  <div className="space-y-2">
                    <select
                      value={localConfig.cellConfig.primaryKey.dynamicType || 'variable'}
                      onChange={(e) => updateConfig('cellConfig.primaryKey.dynamicType', e.target.value)}
                      className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500"
                    >
                      <option value="variable">来自变量</option>
                      <option value="varPath">来自变量.属性</option>
                    </select>

                    {localConfig.cellConfig.primaryKey.dynamicType === 'variable' && (
                      renderVarSelect(
                        localConfig.cellConfig.primaryKey.dynamicValue?.variable || '',
                        (v) => updateConfig('cellConfig.primaryKey.dynamicValue', { ...localConfig.cellConfig.primaryKey.dynamicValue, variable: v }),
                        '选择变量'
                      )
                    )}

                    {localConfig.cellConfig.primaryKey.dynamicType === 'varPath' && (
                      <div className="flex items-center gap-2">
                        <select
                          value={localConfig.cellConfig.primaryKey.dynamicValue?.variable || ''}
                          onChange={(e) => updateConfig('cellConfig.primaryKey.dynamicValue', { ...localConfig.cellConfig.primaryKey.dynamicValue, variable: e.target.value, varPath: '' })}
                          className="flex-1 bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500"
                        >
                          <option value="">选择变量</option>
                          <optgroup label="🔄 循环变量">
                            <option value="$item">$item (当前项)</option>
                          </optgroup>
                          {flowVariables.filter(v => v.dataType === 'object').map(v => (
                            <option key={v.id} value={v.id}>{v.id}</option>
                          ))}
                        </select>
                        <span className="text-gray-400">.</span>
                        <select
                          value={localConfig.cellConfig.primaryKey.dynamicValue?.varPath || ''}
                          onChange={(e) => updateConfig('cellConfig.primaryKey.dynamicValue', { ...localConfig.cellConfig.primaryKey.dynamicValue, varPath: e.target.value })}
                          className="flex-1 bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500"
                        >
                          <option value="">选择属性</option>
                          {getVarPaths(localConfig.cellConfig.primaryKey.dynamicValue?.variable).map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 目标字段 */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">目标字段</label>
                <select
                  value={localConfig.cellConfig.targetField || ''}
                  onChange={(e) => updateConfig('cellConfig.targetField', e.target.value)}
                  className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500"
                >
                  <option value="">-- 选择要更新的字段 --</option>
                  {nonPrimaryFields.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
                  ))}
                </select>
              </div>

              {/* 写入值 */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">写入值</label>
                <div className="flex space-x-2 mb-2 text-xs">
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      checked={localConfig.cellConfig.valueType === 'fixed'}
                      onChange={() => updateConfig('cellConfig.valueType', 'fixed')}
                      className="text-blue-500"
                    />
                    <span className="text-gray-300">常量</span>
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      checked={localConfig.cellConfig.valueType === 'variable'}
                      onChange={() => updateConfig('cellConfig.valueType', 'variable')}
                      className="text-blue-500"
                    />
                    <span className="text-gray-300">变量</span>
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      checked={localConfig.cellConfig.valueType === 'varPath'}
                      onChange={() => updateConfig('cellConfig.valueType', 'varPath')}
                      className="text-blue-500"
                    />
                    <span className="text-gray-300">变量.属性</span>
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      checked={localConfig.cellConfig.valueType === 'system'}
                      onChange={() => updateConfig('cellConfig.valueType', 'system')}
                      className="text-blue-500"
                    />
                    <span className="text-gray-300">系统值</span>
                  </label>
                </div>

                {localConfig.cellConfig.valueType === 'fixed' && (
                  <input
                    type="text"
                    value={localConfig.cellConfig.value || ''}
                    onChange={(e) => updateConfig('cellConfig.value', e.target.value)}
                    placeholder="输入固定值"
                    className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500"
                  />
                )}

                {localConfig.cellConfig.valueType === 'variable' && (
                  renderVarSelect(
                    localConfig.cellConfig.varId || '',
                    (v) => updateConfig('cellConfig.varId', v),
                    '选择变量'
                  )
                )}

                {localConfig.cellConfig.valueType === 'varPath' && (
                  <div className="flex items-center gap-2">
                    <select
                      value={localConfig.cellConfig.varId || ''}
                      onChange={(e) => {
                        updateConfig('cellConfig.varId', e.target.value);
                        updateConfig('cellConfig.varPath', '');
                      }}
                      className="flex-1 bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500"
                    >
                      <option value="">选择变量</option>
                      <optgroup label="🔄 循环变量">
                        <option value="$item">$item (当前项)</option>
                      </optgroup>
                      {flowVariables.filter(v => v.dataType === 'object').map(v => (
                        <option key={v.id} value={v.id}>{v.id}</option>
                      ))}
                    </select>
                    <span className="text-gray-400">.</span>
                    <select
                      value={localConfig.cellConfig.varPath || ''}
                      onChange={(e) => updateConfig('cellConfig.varPath', e.target.value)}
                      className="flex-1 bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500"
                    >
                      <option value="">选择属性</option>
                      {getVarPaths(localConfig.cellConfig.varId).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {localConfig.cellConfig.valueType === 'system' && (
                  <select
                    value={localConfig.cellConfig.value || ''}
                    onChange={(e) => updateConfig('cellConfig.value', e.target.value)}
                    className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500"
                  >
                    <option value="">选择系统值</option>
                    <option value="@NOW">@NOW - 当前时间</option>
                    <option value="@TODAY">@TODAY - 当前日期</option>
                    <option value="@USER">@USER - 当前用户</option>
                  </select>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* 配置预览 */}
      {localConfig.formId && (
        <div className="text-xs text-green-400 bg-green-900/30 rounded p-2">
          {localConfig.writeMode === 'batch' && localConfig.batchConfig.sourceVarId && (
            <>✓ 批量写入 [{localConfig.formName}] ← 变量 {localConfig.batchConfig.sourceVarId} ({(localConfig.batchConfig.fieldMappings || []).length}个映射)</>
          )}
          {localConfig.writeMode === 'single' && localConfig.singleConfig.subMode === 'direct' && (
            <>✓ 逐条整体写入 [{localConfig.formName}] ← {localConfig.singleConfig.sourceVarId || '$item'} (主键自增)</>
          )}
          {localConfig.writeMode === 'single' && localConfig.singleConfig.subMode !== 'direct' && (
            <>✓ 逐条映射写入 [{localConfig.formName}] (主键自增, {(localConfig.singleConfig.fieldValues || []).length}个字段)</>
          )}
          {localConfig.writeMode === 'cell' && localConfig.cellConfig.targetField && (
            <>✓ 更新 [{localConfig.formName}].{nonPrimaryFields.find(f => f.id === localConfig.cellConfig.targetField)?.name}</>
          )}
        </div>
      )}
    </div>
  );
}

window.WriteNodeConfigForm = WriteNodeConfigForm;
