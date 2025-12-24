// 是非分叉节点配置表单
// 已集成变量管理：新增"变量比较"模式，支持从变量管理选择比较对象
function BinaryBranchConfigForm({ 
  node, 
  nodes, 
  flows, 
  onUpdate,
  // 变量管理相关参数
  projectId,
  flowId,
  forms,
  fields  // 新增：字段列表
}) {
  const config = node.config || {};
  
  // 获取当前流程中的其他节点（排除自己）
  const availableNodes = nodes.filter(n => n.id !== node.id);

  // 变量相关状态
  const [variables, setVariables] = React.useState([]);
  const [loadingVars, setLoadingVars] = React.useState(false);
  const [leftVariable, setLeftVariable] = React.useState(null);
  const [rightVariable, setRightVariable] = React.useState(null);

  // 初始化默认值
  React.useEffect(() => {
    // 确保 rightValueType 有默认值
    if (config.rightValueType === undefined) {
      onUpdate({
        config: { ...config, rightValueType: 'fixed' }
      });
    }
  }, []);

  // 加载变量列表
  React.useEffect(() => {
    if (projectId) {
      loadVariables();
    }
  }, [projectId]);

  // 加载左值变量详情
  React.useEffect(() => {
    if (config.leftVariableId && projectId) {
      loadVariableDetail(config.leftVariableId, setLeftVariable);
    }
  }, [config.leftVariableId, projectId]);

  // 加载右值变量详情
  React.useEffect(() => {
    if (config.rightValueType === 'variable' && config.rightVariableId && projectId) {
      loadVariableDetail(config.rightVariableId, setRightVariable);
    }
  }, [config.rightVariableId, config.rightValueType, projectId]);

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

  const loadVariableDetail = async (variableId, setter) => {
    try {
      const variable = await window.dndDB.getVariableById(projectId, variableId);
      setter(variable);
    } catch (error) {
      console.error('加载变量详情失败:', error);
    }
  };
  
  const updateConfig = (key, value) => {
    onUpdate({
      config: { ...config, [key]: value }
    });
  };

  // 批量更新配置
  const updateConfigMultiple = (updates) => {
    onUpdate({
      config: { ...config, ...updates }
    });
  };

  // 选择左值变量
  const handleSelectLeftVariable = async (variableId) => {
    if (!variableId) {
      setLeftVariable(null);
      updateConfigMultiple({ 
        leftVariableId: '', 
        leftVariablePath: '',
        // 同时更新兼容的condition字段
        condition: ''
      });
      return;
    }

    try {
      const variable = await window.dndDB.getVariableById(projectId, variableId);
      setLeftVariable(variable);
      
      // 记录变量使用
      if (node.id && flowId) {
        await window.dndDB.addVariableUsage(projectId, variableId, node.id, flowId);
      }

      // 如果变量是对象/数组类型，且只有一个字段，自动选中
      const varFields = getVariableFieldsFromVar(variable);
      const autoPath = varFields.length === 1 ? varFields[0].fieldId : '';

      updateConfigMultiple({ 
        leftVariableId: variableId, 
        leftVariablePath: autoPath
      });
    } catch (error) {
      console.error('选择变量失败:', error);
    }
  };

  // 选择右值变量
  const handleSelectRightVariable = async (variableId) => {
    if (!variableId) {
      setRightVariable(null);
      updateConfigMultiple({ 
        rightVariableId: '', 
        rightVariablePath: ''
      });
      return;
    }

    try {
      const variable = await window.dndDB.getVariableById(projectId, variableId);
      setRightVariable(variable);
      
      // 记录变量使用
      if (node.id && flowId) {
        await window.dndDB.addVariableUsage(projectId, variableId, node.id, flowId);
      }

      // 如果变量是对象/数组类型，且只有一个字段，自动选中
      const varFields = getVariableFieldsFromVar(variable);
      const autoPath = varFields.length === 1 ? varFields[0].fieldId : '';

      updateConfigMultiple({ 
        rightVariableId: variableId, 
        rightVariablePath: autoPath
      });
    } catch (error) {
      console.error('选择变量失败:', error);
    }
  };

  // 获取变量的字段列表（通过变量对象）
  const getVariableFieldsFromVar = (variable) => {
    if (!variable || !variable.sourceFormId || !forms) return [];
    const form = forms.find(f => f.id === variable.sourceFormId);
    if (!form) return [];
    
    // 基础表使用 fields，属性表使用 levelFields
    if (form.type === '属性表单') {
      const levelFields = form.structure?.levelFields || [];
      return levelFields.map(lf => ({
        fieldId: lf.fieldId,
        name: getFieldName(lf.fieldId)
      }));
    }
    
    const structFields = form.structure?.fields || [];
    return structFields.map(f => ({
      fieldId: f.fieldId,
      name: getFieldName(f.fieldId)
    }));
  };

  // 获取变量的字段列表（兼容旧方法）
  const getVariableFields = (variable) => {
    return getVariableFieldsFromVar(variable);
  };

  // 获取字段名称
  const getFieldName = (fieldId) => {
    if (!fields) return fieldId;
    const field = fields.find(f => f.id === fieldId);
    return field?.name || fieldId;
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

  // 判断变量是否需要选择字段（对象或数组类型）
  const needFieldSelection = (variable) => {
    if (!variable) return false;
    return variable.dataType === 'object' || variable.dataType === 'array';
  };

  // 比较运算符
  const operators = [
    { value: '==', label: '等于 (==)' },
    { value: '!=', label: '不等于 (!=)' },
    { value: '>', label: '大于 (>)' },
    { value: '>=', label: '大于等于 (>=)' },
    { value: '<', label: '小于 (<)' },
    { value: '<=', label: '小于等于 (<=)' },
    { value: 'contains', label: '包含' },
    { value: 'startsWith', label: '开头是' },
    { value: 'endsWith', label: '结尾是' }
  ];

  // 生成条件表达式（用于预览和执行）
  const generateConditionExpression = () => {
    if (config.conditionMode === 'expression') {
      return config.condition || '???';
    }

    const left = config.leftVariableId 
      ? (config.leftVariablePath ? `${config.leftVariableId}.${config.leftVariablePath}` : config.leftVariableId)
      : '???';
    
    const op = config.operator || '==';
    
    let right = '???';
    const rightType = config.rightValueType || 'fixed';
    if (rightType === 'fixed') {
      right = typeof config.rightFixedValue === 'string' ? `"${config.rightFixedValue}"` : config.rightFixedValue;
    } else if (rightType === 'variable') {
      right = config.rightVariableId 
        ? (config.rightVariablePath ? `${config.rightVariableId}.${config.rightVariablePath}` : config.rightVariableId)
        : '???';
    } else if (rightType === 'system') {
      right = config.rightSystemValue || '???';
    }

    return `${left} ${op} ${right}`;
  };

  // 检查配置是否完整
  const isConfigComplete = () => {
    // 检查左值
    if (!config.leftVariableId) return false;
    if (needFieldSelection(leftVariable) && !config.leftVariablePath) return false;
    
    // 检查右值
    const rightType = config.rightValueType || 'fixed';
    if (rightType === 'fixed' && !config.rightFixedValue) return false;
    if (rightType === 'variable' && !config.rightVariableId) return false;
    if (rightType === 'system' && !config.rightSystemValue) return false;
    
    return true;
  };

  const leftFields = getVariableFields(leftVariable);
  const rightFields = getVariableFields(rightVariable);
  const rightValueType = config.rightValueType || 'fixed';  // 默认固定值

  return (
    <div className="space-y-4">
      {/* 判断模式选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">判断方式</label>
        <div className="flex space-x-4">
          <label className="flex items-center text-sm text-gray-300 cursor-pointer">
            <input
              type="radio"
              checked={config.conditionMode !== 'expression'}
              onChange={() => updateConfig('conditionMode', 'compare')}
              className="mr-2"
            />
            变量比较（推荐）
          </label>
          <label className="flex items-center text-sm text-gray-300 cursor-pointer">
            <input
              type="radio"
              checked={config.conditionMode === 'expression'}
              onChange={() => updateConfig('conditionMode', 'expression')}
              className="mr-2"
            />
            表达式（高级）
          </label>
        </div>
      </div>

      {/* 变量比较模式 */}
      {config.conditionMode !== 'expression' && (
        <div className="bg-gray-700 rounded-lg p-4 space-y-4">
          {/* 左值 - 选择变量 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              比较对象（左值） <span className="text-red-400">*</span>
            </label>
            {loadingVars ? (
              <div className="text-sm text-gray-400">加载中...</div>
            ) : variables.length === 0 ? (
              <div className="bg-gray-600 rounded p-3 text-sm text-gray-400 text-center">
                暂无可用变量，请先在读取节点中创建变量
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value={config.leftVariableId || ''}
                  onChange={(e) => handleSelectLeftVariable(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                >
                  <option value="">-- 选择变量 --</option>
                  {variables.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.id} {v.name ? `(${v.name})` : ''} [{getDataTypeText(v.dataType)}]
                    </option>
                  ))}
                </select>

                {/* 选择字段 - 仅当变量是对象/数组类型时才需要 */}
                {leftVariable && needFieldSelection(leftVariable) && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">
                        字段<span className="text-red-400">*</span>:
                      </span>
                      {leftFields.length > 0 ? (
                        <select
                          value={config.leftVariablePath || ''}
                          onChange={(e) => updateConfig('leftVariablePath', e.target.value)}
                          className={`flex-1 px-2 py-1.5 bg-gray-600 border rounded text-white text-sm ${
                            !config.leftVariablePath ? 'border-red-500' : 'border-gray-500'
                          }`}
                        >
                          <option value="">-- 请选择字段 --</option>
                          {leftFields.map(f => (
                            <option key={f.fieldId} value={f.fieldId}>{f.name || f.fieldId}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={config.leftVariablePath || ''}
                          onChange={(e) => updateConfig('leftVariablePath', e.target.value)}
                          placeholder="输入字段路径，如 id"
                          className="flex-1 px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                        />
                      )}
                    </div>
                    {/* 未选择字段时的警告 */}
                    {!config.leftVariablePath && (
                      <div className="text-xs text-red-400 flex items-center">
                        ⚠️ 变量是{getDataTypeText(leftVariable.dataType)}类型，必须选择具体字段才能比较
                      </div>
                    )}
                    <div className="text-xs text-yellow-400">
                      💡 建议：在读取节点中选择字段，使输出变量为纯值，这样更简洁
                    </div>
                  </div>
                )}
                
                {/* 纯值变量提示 */}
                {leftVariable && !needFieldSelection(leftVariable) && (
                  <div className="text-xs text-green-400 mt-1">
                    ✓ 变量是{getDataTypeText(leftVariable.dataType)}类型，可直接比较
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 运算符 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              运算符 <span className="text-red-400">*</span>
            </label>
            <select
              value={config.operator || '=='}
              onChange={(e) => updateConfig('operator', e.target.value)}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
            >
              {operators.map(op => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
          </div>

          {/* 右值 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              比较值（右值） <span className="text-red-400">*</span>
            </label>
            
            {/* 右值类型选择 */}
            <div className="flex space-x-4 mb-2">
              <label className="flex items-center text-sm text-gray-300 cursor-pointer">
                <input
                  type="radio"
                  checked={rightValueType === 'fixed'}
                  onChange={() => updateConfigMultiple({ rightValueType: 'fixed', rightVariableId: '', rightVariablePath: '' })}
                  className="mr-2"
                />
                固定值
              </label>
              <label className="flex items-center text-sm text-gray-300 cursor-pointer">
                <input
                  type="radio"
                  checked={rightValueType === 'variable'}
                  onChange={() => updateConfigMultiple({ rightValueType: 'variable', rightFixedValue: '' })}
                  className="mr-2"
                />
                变量
              </label>
              <label className="flex items-center text-sm text-gray-300 cursor-pointer">
                <input
                  type="radio"
                  checked={rightValueType === 'system'}
                  onChange={() => updateConfigMultiple({ rightValueType: 'system', rightFixedValue: '', rightVariableId: '' })}
                  className="mr-2"
                />
                系统值
              </label>
            </div>

            {/* 固定值输入 */}
            {rightValueType === 'fixed' && (
              <input
                type="text"
                value={config.rightFixedValue || ''}
                onChange={(e) => updateConfig('rightFixedValue', e.target.value)}
                placeholder="输入固定值"
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
              />
            )}

            {/* 系统值选择 */}
            {rightValueType === 'system' && (
              <select
                value={config.rightSystemValue || ''}
                onChange={(e) => updateConfig('rightSystemValue', e.target.value)}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
              >
                <option value="">-- 选择系统值 --</option>
                <option value="@NOW">@NOW - 当前时间</option>
                <option value="@TODAY">@TODAY - 当前日期</option>
                <option value="@USER">@USER - 当前用户ID</option>
                <option value="@USERNAME">@USERNAME - 当前用户名</option>
              </select>
            )}

            {/* 变量选择 */}
            {rightValueType === 'variable' && (
              <div className="space-y-2">
                <select
                  value={config.rightVariableId || ''}
                  onChange={(e) => handleSelectRightVariable(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                >
                  <option value="">-- 选择变量 --</option>
                  {variables.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.id} {v.name ? `(${v.name})` : ''} [{getDataTypeText(v.dataType)}]
                    </option>
                  ))}
                </select>

                {/* 选择字段 - 当变量是对象/数组类型时必须选择 */}
                {rightVariable && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">
                        字段{needFieldSelection(rightVariable) && <span className="text-red-400">*</span>}:
                      </span>
                      {rightFields.length > 0 ? (
                        <select
                          value={config.rightVariablePath || ''}
                          onChange={(e) => updateConfig('rightVariablePath', e.target.value)}
                          className={`flex-1 px-2 py-1.5 bg-gray-600 border rounded text-white text-sm ${
                            needFieldSelection(rightVariable) && !config.rightVariablePath 
                              ? 'border-red-500' 
                              : 'border-gray-500'
                          }`}
                        >
                          <option value="">-- 请选择字段 --</option>
                          {rightFields.map(f => (
                            <option key={f.fieldId} value={f.fieldId}>{f.name || f.fieldId}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={config.rightVariablePath || ''}
                          onChange={(e) => updateConfig('rightVariablePath', e.target.value)}
                          placeholder="输入字段路径"
                          className="flex-1 px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                        />
                      )}
                    </div>
                    {/* 未选择字段时的警告 */}
                    {needFieldSelection(rightVariable) && !config.rightVariablePath && (
                      <div className="text-xs text-red-400 flex items-center">
                        ⚠️ 变量是{getDataTypeText(rightVariable.dataType)}类型，必须选择具体字段才能比较
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 表达式模式（高级） */}
      {config.conditionMode === 'expression' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            判断条件 <span className="text-red-400">*</span>
          </label>
          <textarea
            value={config.condition || ''}
            onChange={(e) => updateConfig('condition', e.target.value)}
            placeholder="输入逻辑表达式，如：aaaaa.余额 >= bbbbb.金额"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm h-20 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            支持变量ID、比较运算（==, !=, &gt;, &lt;, &gt;=, &lt;=）、逻辑运算（&&, ||, !）
          </p>
        </div>
      )}

      {/* 条件说明 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          条件说明（可选）
        </label>
        <input
          type="text"
          value={config.conditionLabel || ''}
          onChange={(e) => updateConfig('conditionLabel', e.target.value)}
          placeholder="如：余额是否充足"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        />
      </div>

      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-sm font-medium text-green-400 mb-3">✓ 条件为真时（是）</h4>
        
        {/* 真分支 - 跳转类型 */}
        <div className="mb-3">
          <label className="block text-xs text-gray-400 mb-1">跳转类型</label>
          <div className="flex space-x-4">
            <label className="flex items-center text-sm text-gray-300">
              <input
                type="radio"
                checked={config.trueAction?.type !== 'flow'}
                onChange={() => updateConfig('trueAction', { type: 'node', target: config.trueAction?.target || '' })}
                className="mr-2"
              />
              跳转到节点
            </label>
            <label className="flex items-center text-sm text-gray-300">
              <input
                type="radio"
                checked={config.trueAction?.type === 'flow'}
                onChange={() => updateConfig('trueAction', { type: 'flow', target: '' })}
                className="mr-2"
              />
              跳转到流程
            </label>
          </div>
        </div>

        {/* 真分支 - 目标选择 */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            {config.trueAction?.type === 'flow' ? '目标流程' : '目标节点'}
          </label>
          <select
            value={config.trueAction?.target || ''}
            onChange={(e) => updateConfig('trueAction', { ...config.trueAction, target: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          >
            <option value="">-- 请选择 --</option>
            {config.trueAction?.type === 'flow' ? (
              flows?.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))
            ) : (
              availableNodes.map(n => (
                <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
              ))
            )}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            💡 也可以通过连线指定，连线会覆盖此设置
          </p>
        </div>
      </div>

      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-sm font-medium text-red-400 mb-3">✗ 条件为假时（否）</h4>
        
        {/* 假分支 - 跳转类型 */}
        <div className="mb-3">
          <label className="block text-xs text-gray-400 mb-1">跳转类型</label>
          <div className="flex space-x-4">
            <label className="flex items-center text-sm text-gray-300">
              <input
                type="radio"
                checked={config.falseAction?.type !== 'flow'}
                onChange={() => updateConfig('falseAction', { type: 'node', target: config.falseAction?.target || '' })}
                className="mr-2"
              />
              跳转到节点
            </label>
            <label className="flex items-center text-sm text-gray-300">
              <input
                type="radio"
                checked={config.falseAction?.type === 'flow'}
                onChange={() => updateConfig('falseAction', { type: 'flow', target: '' })}
                className="mr-2"
              />
              跳转到流程
            </label>
          </div>
        </div>

        {/* 假分支 - 目标选择 */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            {config.falseAction?.type === 'flow' ? '目标流程' : '目标节点'}
          </label>
          <select
            value={config.falseAction?.target || ''}
            onChange={(e) => updateConfig('falseAction', { ...config.falseAction, target: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          >
            <option value="">-- 请选择 --</option>
            {config.falseAction?.type === 'flow' ? (
              flows?.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))
            ) : (
              availableNodes.map(n => (
                <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
              ))
            )}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            💡 也可以通过连线指定，连线会覆盖此设置
          </p>
        </div>
      </div>

      {/* 预览 */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">配置预览</h4>
        
        {/* 配置完整性检查 */}
        {config.conditionMode !== 'expression' && !isConfigComplete() && (
          <div className="bg-red-900/30 border border-red-500 rounded p-3 mb-3 text-sm text-red-300">
            ⚠️ 配置不完整，请检查：
            <ul className="mt-1 ml-4 list-disc text-xs">
              {!config.leftVariableId && <li>请选择比较对象（左值）</li>}
              {needFieldSelection(leftVariable) && !config.leftVariablePath && (
                <li>请选择左值变量的具体字段</li>
              )}
              {rightValueType === 'fixed' && !config.rightFixedValue && (
                <li>请输入固定比较值</li>
              )}
              {rightValueType === 'variable' && !config.rightVariableId && (
                <li>请选择比较变量</li>
              )}
              {rightValueType === 'system' && !config.rightSystemValue && (
                <li>请选择系统值</li>
              )}
            </ul>
          </div>
        )}
        
        <div className="bg-gray-900 rounded p-3 text-xs font-mono">
          <div className="text-yellow-400">
            if ({generateConditionExpression()}) {'{'}
          </div>
          <div className="text-green-400 pl-4">
            → {config.trueAction?.type === 'flow' ? '流程' : '节点'}: {config.trueAction?.target || '未指定'}
          </div>
          <div className="text-yellow-400">{'}'} else {'{'}</div>
          <div className="text-red-400 pl-4">
            → {config.falseAction?.type === 'flow' ? '流程' : '节点'}: {config.falseAction?.target || '未指定'}
          </div>
          <div className="text-yellow-400">{'}'}</div>
        </div>
      </div>
    </div>
  );
}

window.BinaryBranchConfigForm = BinaryBranchConfigForm;
