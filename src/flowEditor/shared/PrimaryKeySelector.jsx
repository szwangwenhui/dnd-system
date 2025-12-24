// 主键取值选择器 - 通用组件
// 用于：读取、更新、删除、开始节点（间隔扫描）、校验节点等
// 已集成变量管理：动态取值-来自变量 支持从变量管理选择
function PrimaryKeySelector({ 
  formId, 
  forms, 
  pages, 
  blocks, 
  value, 
  onChange, 
  label,
  // 变量管理相关参数
  projectId,
  flowId,
  nodeId
}) {
  // 默认值结构
  const defaultValue = {
    mode: 'static',
    staticValue: '',
    dynamicType: 'variable',
    dynamicValue: {
      variableId: '',      // 变量ID（新增）
      variablePath: '',    // 变量路径如 .id （新增）
      variable: '',        // 兼容旧版：完整路径如 user.id
      pageId: '',
      blockId: '',
      urlParam: ''
    }
  };

  // 合并默认值和传入值
  const currentValue = {
    ...defaultValue,
    ...value,
    dynamicValue: { ...defaultValue.dynamicValue, ...(value?.dynamicValue || {}) }
  };

  // 变量相关状态
  const [variables, setVariables] = React.useState([]);
  const [selectedVariable, setSelectedVariable] = React.useState(null);
  const [loadingVars, setLoadingVars] = React.useState(false);

  // 加载变量列表
  React.useEffect(() => {
    if (projectId) {
      loadVariables();
    }
  }, [projectId]);

  // 加载选中的变量详情
  React.useEffect(() => {
    if (currentValue.dynamicValue.variableId && projectId) {
      loadSelectedVariable(currentValue.dynamicValue.variableId);
    }
  }, [currentValue.dynamicValue.variableId, projectId]);

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

  const loadSelectedVariable = async (variableId) => {
    try {
      const variable = await window.dndDB.getVariableById(projectId, variableId);
      setSelectedVariable(variable);
    } catch (error) {
      console.error('加载变量详情失败:', error);
    }
  };

  // 更新值
  const updateValue = (updates) => {
    const newValue = { ...currentValue, ...updates };
    if (updates.dynamicValue) {
      newValue.dynamicValue = { ...currentValue.dynamicValue, ...updates.dynamicValue };
    }
    onChange(newValue);
  };

  // 选择变量时
  const handleSelectVariable = async (variableId) => {
    if (!variableId) {
      setSelectedVariable(null);
      updateValue({ 
        dynamicValue: { 
          variableId: '', 
          variablePath: '',
          variable: '' 
        } 
      });
      return;
    }

    try {
      const variable = await window.dndDB.getVariableById(projectId, variableId);
      setSelectedVariable(variable);
      
      // 记录变量使用
      if (nodeId && flowId) {
        await window.dndDB.addVariableUsage(projectId, variableId, nodeId, flowId);
      }

      // 更新值
      updateValue({ 
        dynamicValue: { 
          variableId: variableId,
          variablePath: '',
          variable: variableId  // 兼容旧版
        } 
      });
    } catch (error) {
      console.error('选择变量失败:', error);
    }
  };

  // 获取表单的已有数据（用于静态取值下拉）
  const getFormData = () => {
    if (!formId || !forms) return [];
    const form = forms.find(f => f.id === formId);
    return form?.data || [];
  };

  // 获取表单的主键字段
  const getPrimaryKeyField = () => {
    if (!formId || !forms) return null;
    const form = forms.find(f => f.id === formId);
    return form?.structure?.primaryKey || null;
  };

  // 获取页面的输入区块
  const getPageInputBlocks = (pageId) => {
    if (!pageId) return [];
    if (blocks && blocks.length > 0) {
      const pageBlocks = blocks.filter(b => b.pageId === pageId);
      return pageBlocks;
    }
    if (pages) {
      const page = pages.find(p => p.id === pageId);
      return page?.design?.blocks || [];
    }
    return [];
  };

  // 获取变量的可用字段（用于选择路径）
  const getVariableFields = () => {
    if (!selectedVariable) return [];
    
    // 如果有来源表单，获取表单字段
    if (selectedVariable.sourceFormId && forms) {
      const form = forms.find(f => f.id === selectedVariable.sourceFormId);
      if (form) {
        // 从字段定义中获取
        const formFields = form.structure?.fields || [];
        // 添加主键字段
        const pkField = form.structure?.primaryKeyField;
        if (pkField && !formFields.find(f => f.id === pkField)) {
          formFields.unshift({ id: pkField, name: '主键' });
        }
        return formFields;
      }
    }
    return [];
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

  const formData = getFormData();
  const primaryKeyField = getPrimaryKeyField();
  const variableFields = getVariableFields();

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">{label || '主键取值'}</label>
      
      {/* 取值方式选择 */}
      <div className="flex space-x-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            checked={currentValue.mode === 'static'}
            onChange={() => updateValue({ mode: 'static' })}
            className="text-blue-500"
          />
          <span className="text-gray-200 text-sm">静态取值</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            checked={currentValue.mode === 'dynamic'}
            onChange={() => updateValue({ mode: 'dynamic' })}
            className="text-blue-500"
          />
          <span className="text-gray-200 text-sm">动态取值</span>
        </label>
      </div>

      {/* 静态取值 */}
      {currentValue.mode === 'static' && (
        <div className="bg-gray-600 rounded-lg p-3">
          <label className="block text-xs text-gray-400 mb-1">选择记录</label>
          {formData.length > 0 ? (
            <select
              value={currentValue.staticValue}
              onChange={(e) => updateValue({ staticValue: e.target.value })}
              className="w-full bg-gray-700 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- 选择记录 --</option>
              {formData.map((record, index) => {
                const pkValue = primaryKeyField ? record[primaryKeyField] : record.id || index;
                const displayText = primaryKeyField 
                  ? `${primaryKeyField}: ${pkValue}`
                  : `记录 ${index + 1}`;
                return (
                  <option key={index} value={pkValue}>{displayText}</option>
                );
              })}
            </select>
          ) : (
            <div className="text-xs text-gray-400 bg-gray-700 rounded p-2">
              该表单暂无数据，请先添加数据或使用动态取值
            </div>
          )}
        </div>
      )}

      {/* 动态取值 */}
      {currentValue.mode === 'dynamic' && (
        <div className="bg-gray-600 rounded-lg p-3 space-y-3">
          {/* 动态取值类型 */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">取值来源</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={currentValue.dynamicType === 'variable'}
                  onChange={() => updateValue({ dynamicType: 'variable' })}
                  className="text-blue-500"
                />
                <span className="text-gray-200 text-sm">来自变量</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={currentValue.dynamicType === 'page'}
                  onChange={() => updateValue({ dynamicType: 'page' })}
                  className="text-blue-500"
                />
                <span className="text-gray-200 text-sm">来自页面输入框</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={currentValue.dynamicType === 'urlParam'}
                  onChange={() => updateValue({ dynamicType: 'urlParam' })}
                  className="text-blue-500"
                />
                <span className="text-gray-200 text-sm">来自URL参数</span>
              </label>
            </div>
          </div>

          {/* 来自变量 - 集成变量管理 */}
          {currentValue.dynamicType === 'variable' && (
            <div className="space-y-2">
              <label className="block text-xs text-gray-400 mb-1">选择变量</label>
              
              {loadingVars ? (
                <div className="text-sm text-gray-400">加载中...</div>
              ) : variables.length === 0 ? (
                <div className="bg-gray-700 rounded p-2 text-xs text-gray-400 text-center">
                  暂无可用变量，请先在读取节点中创建变量
                </div>
              ) : (
                <>
                  <select
                    value={currentValue.dynamicValue.variableId || ''}
                    onChange={(e) => handleSelectVariable(e.target.value)}
                    className="w-full bg-gray-700 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- 选择变量 --</option>
                    {variables.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.id} {v.name ? `(${v.name})` : ''} [{getDataTypeText(v.dataType)}]
                      </option>
                    ))}
                  </select>

                  {/* 选中变量后显示详情和字段选择 */}
                  {selectedVariable && (
                    <div className="bg-gray-700 rounded p-2 space-y-2">
                      <div className="text-xs text-gray-400">
                        来源: {selectedVariable.sourceFormName || selectedVariable.sourceNodeType}
                        {selectedVariable.dataType === 'object' && ' (单条记录)'}
                        {selectedVariable.dataType === 'array' && ' (多条记录)'}
                      </div>
                      
                      {/* 如果是对象类型，可以选择字段路径 */}
                      {(selectedVariable.dataType === 'object' || selectedVariable.dataType === 'array') && variableFields.length > 0 && (
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">选择字段</label>
                          <select
                            value={currentValue.dynamicValue.variablePath || ''}
                            onChange={(e) => {
                              const fieldId = e.target.value;
                              updateValue({ 
                                dynamicValue: { 
                                  variablePath: fieldId,
                                  variable: `${currentValue.dynamicValue.variableId}.${fieldId}`
                                } 
                              });
                            }}
                            className="w-full bg-gray-600 text-gray-200 rounded px-2 py-1.5 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
                          >
                            <option value="">-- 选择字段 --</option>
                            {variableFields.map(f => (
                              <option key={f.id} value={f.id}>{f.name || f.id}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* 也支持手动输入路径 */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">或手动输入路径</label>
                        <input
                          type="text"
                          value={currentValue.dynamicValue.variablePath || ''}
                          onChange={(e) => {
                            const path = e.target.value;
                            updateValue({ 
                              dynamicValue: { 
                                variablePath: path,
                                variable: path ? `${currentValue.dynamicValue.variableId}.${path}` : currentValue.dynamicValue.variableId
                              } 
                            });
                          }}
                          placeholder="如：id 或 userId"
                          className="w-full bg-gray-600 text-gray-200 rounded px-2 py-1.5 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* 来自页面输入框 */}
          {currentValue.dynamicType === 'page' && (
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">选择页面</label>
                <select
                  value={currentValue.dynamicValue.pageId}
                  onChange={(e) => updateValue({ 
                    dynamicValue: { pageId: e.target.value, blockId: '' } 
                  })}
                  className="w-full bg-gray-700 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- 选择页面 --</option>
                  {pages?.map(p => (
                    <option key={p.id} value={p.id}>[{p.roleName}] {p.name}</option>
                  ))}
                </select>
              </div>
              
              {currentValue.dynamicValue.pageId && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">选择输入框</label>
                  <select
                    value={currentValue.dynamicValue.blockId}
                    onChange={(e) => updateValue({ dynamicValue: { blockId: e.target.value } })}
                    className="w-full bg-gray-700 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- 选择输入框 --</option>
                    {getPageInputBlocks(currentValue.dynamicValue.pageId).map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name || b.label || b.title || b.buttonText || b.content?.substring(0, 20) || b.id}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* 来自URL参数 */}
          {currentValue.dynamicType === 'urlParam' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">参数名</label>
              <input
                type="text"
                value={currentValue.dynamicValue.urlParam}
                onChange={(e) => updateValue({ dynamicValue: { urlParam: e.target.value } })}
                placeholder="如：userId、orderId"
                className="w-full bg-gray-700 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                页面URL中的参数名，如 ?userId=123 中的 userId
              </p>
            </div>
          )}
        </div>
      )}

      {/* 当前配置预览 */}
      {(currentValue.staticValue || 
        currentValue.dynamicValue.variableId || 
        currentValue.dynamicValue.blockId || 
        currentValue.dynamicValue.urlParam) && (
        <div className="text-xs text-green-400 bg-green-900/30 rounded p-2">
          ✓ 已配置：
          {currentValue.mode === 'static' && `静态值 = ${currentValue.staticValue}`}
          {currentValue.mode === 'dynamic' && currentValue.dynamicType === 'variable' && 
            `变量 ${currentValue.dynamicValue.variableId}${currentValue.dynamicValue.variablePath ? '.' + currentValue.dynamicValue.variablePath : ''}`}
          {currentValue.mode === 'dynamic' && currentValue.dynamicType === 'page' && 
            `页面输入框`}
          {currentValue.mode === 'dynamic' && currentValue.dynamicType === 'urlParam' && 
            `URL参数 ${currentValue.dynamicValue.urlParam}`}
        </div>
      )}
    </div>
  );
}

window.PrimaryKeySelector = PrimaryKeySelector;
