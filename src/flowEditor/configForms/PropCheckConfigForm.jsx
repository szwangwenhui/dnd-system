// 属性校验节点配置表单
// 功能：根据主键查询属性字段值，输出键值对数组
function PropCheckConfigForm({ 
  node, 
  nodes, 
  forms,
  fields,
  onUpdate,
  projectId,
  flowId
}) {
  const config = node.config || {};
  const outputFields = config.outputFields || [];
  
  // 获取当前流程中的其他节点（排除自己）
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

  // 批量更新
  const updateConfigBatch = (updates) => {
    onUpdate({
      config: { ...config, ...updates }
    });
  };

  // 选择输入变量
  const handleSelectSourceVariable = async (variableId) => {
    if (node.id && flowId && projectId && variableId) {
      try {
        await window.dndDB.addVariableUsage(projectId, variableId, node.id, flowId);
      } catch (error) {
        console.error('记录变量使用失败:', error);
      }
    }
    updateConfig('sourceVariableId', variableId);
  };

  // 选择目标表单
  const handleSelectTargetForm = (formId) => {
    const form = forms?.find(f => f.id === formId);
    updateConfigBatch({
      targetFormId: formId,
      targetFormName: form?.name || '',
      outputFields: []  // 清空已选字段
    });
  };

  // 获取目标表单的字段列表
  const getTargetFormFields = () => {
    if (!config.targetFormId || !forms) return [];
    const form = forms.find(f => f.id === config.targetFormId);
    if (!form || !form.structure) return [];
    
    // 根据表单类型返回字段
    if (form.type === '属性表单') {
      return form.structure.levelFields || [];
    } else {
      return form.structure.fields || [];
    }
  };

  // 获取字段名称
  const getFieldName = (fieldId) => {
    if (!fieldId || !fields) return fieldId;
    const field = fields.find(f => f.id === fieldId || f.fieldId === fieldId);
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

  // 切换字段选中状态
  const toggleFieldSelection = (fieldId) => {
    const currentFields = [...outputFields];
    const index = currentFields.indexOf(fieldId);
    if (index > -1) {
      currentFields.splice(index, 1);
    } else {
      currentFields.push(fieldId);
    }
    updateConfig('outputFields', currentFields);
  };

  // 获取选中变量的信息
  const selectedVariable = variables.find(v => v.id === config.sourceVariableId);
  const targetFormFields = getTargetFormFields();

  // 过滤出包含主键信息的变量（对象类型）
  const objectVariables = variables.filter(v => 
    v.dataType === 'object' || v.dataType === 'array'
  );

  return (
    <div className="space-y-4">
      {/* 说明 */}
      <div className="bg-orange-900/30 border border-orange-700 rounded p-3">
        <p className="text-sm text-orange-300">
          ✓ 属性校验：根据主键值查询表单记录，获取指定字段的值
        </p>
        <p className="text-xs text-orange-400 mt-1">
          输出所有选中字段的键值对数组，可用于后续的多条件分叉
        </p>
      </div>

      {/* 输入变量选择 */}
      <div className="bg-blue-900/30 p-3 rounded border border-blue-700">
        <label className="block text-sm font-medium text-blue-300 mb-2">
          📦 输入变量（含主键）<span className="text-red-400">*</span>
        </label>
        {loadingVars ? (
          <div className="text-sm text-gray-400">加载中...</div>
        ) : objectVariables.length === 0 ? (
          <div className="text-sm text-yellow-400">
            ⚠️ 暂无可用的对象变量，请先添加读取节点创建包含主键的变量
          </div>
        ) : (
          <select
            value={config.sourceVariableId || ''}
            onChange={(e) => handleSelectSourceVariable(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          >
            <option value="">-- 选择变量 --</option>
            {objectVariables.map(v => (
              <option key={v.id} value={v.id}>
                {v.id} {v.name ? `(${v.name})` : ''} [{getDataTypeText(v.dataType)}]
              </option>
            ))}
          </select>
        )}
        {config.sourceVariableId && (
          <div className="mt-2 text-xs text-gray-400">
            将使用变量 <span className="text-blue-300">{config.sourceVariableId}</span> 中的主键值进行查询
          </div>
        )}
      </div>

      {/* 校验表单选择 */}
      <div className="bg-green-900/30 p-3 rounded border border-green-700">
        <label className="block text-sm font-medium text-green-300 mb-2">
          📋 校验表单<span className="text-red-400">*</span>
        </label>
        <select
          value={config.targetFormId || ''}
          onChange={(e) => handleSelectTargetForm(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        >
          <option value="">-- 选择表单 --</option>
          {forms?.map(form => (
            <option key={form.id} value={form.id}>
              {form.name} [{form.type || form.subType}]
            </option>
          ))}
        </select>
        {config.targetFormId && (
          <div className="mt-2 text-xs text-gray-400">
            将在表单 <span className="text-green-300">{config.targetFormName}</span> 中查询
          </div>
        )}
      </div>

      {/* 输出字段选择 */}
      {config.targetFormId && (
        <div className="bg-gray-800 p-3 rounded border border-gray-600">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            📤 输出字段<span className="text-red-400">*</span>
          </label>
          <p className="text-xs text-gray-400 mb-3">
            选择要查询并输出的字段（可多选）
          </p>
          
          {targetFormFields.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {targetFormFields.map(field => {
                const fieldId = field.fieldId || field.id;
                const isSelected = outputFields.includes(fieldId);
                return (
                  <label 
                    key={fieldId}
                    className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-900/50 border border-blue-600' : 'bg-gray-700/50 hover:bg-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFieldSelection(fieldId)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <span className="text-white text-sm">{getFieldName(fieldId)}</span>
                      <span className="text-gray-400 text-xs ml-2">({fieldId})</span>
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-yellow-400">
              ⚠️ 该表单没有可用字段
            </div>
          )}
          
          {outputFields.length > 0 && (
            <div className="mt-3 text-xs text-green-400">
              ✓ 已选择 {outputFields.length} 个字段
            </div>
          )}
          
          {outputFields.length === 0 && targetFormFields.length > 0 && (
            <div className="mt-3 text-xs text-yellow-400">
              ⚠️ 请至少选择一个输出字段
            </div>
          )}
        </div>
      )}

      {/* 输出变量 */}
      <div className="bg-purple-900/30 p-3 rounded border border-purple-700">
        <label className="block text-sm font-medium text-purple-300 mb-2">
          💾 输出变量名
        </label>
        <input
          type="text"
          value={config.outputVariableId || ''}
          onChange={(e) => updateConfig('outputVariableId', e.target.value)}
          placeholder="如：userInfo、productData"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        />
        <div className="mt-2 text-xs text-gray-400">
          查询结果将存储为键值对数组：[{`{ field1: "值1", field2: "值2" }`}]
        </div>
      </div>

      {/* 数据不存在时的处理（必配） */}
      <div className="bg-red-900/30 p-3 rounded border border-red-700">
        <label className="block text-sm font-medium text-red-300 mb-2">
          ⚠️ 数据不存在时 → 跳转到<span className="text-red-400">*</span>
        </label>
        <select
          value={config.notExistNodeId || ''}
          onChange={(e) => updateConfig('notExistNodeId', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        >
          <option value="">-- 必须选择 --</option>
          {availableNodes.map(n => (
            <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
          ))}
        </select>
        <div className="mt-2 text-xs text-red-300">
          当根据主键查询不到数据时，将跳转到此节点
        </div>
      </div>

      {/* 逻辑预览 */}
      {config.sourceVariableId && config.targetFormId && outputFields.length > 0 && (
        <div className="bg-gray-700/30 p-3 rounded">
          <div className="text-xs text-gray-400 mb-1">查询逻辑预览：</div>
          <div className="text-sm font-mono space-y-1">
            <div>
              <span className="text-gray-400">从</span>
              <span className="text-blue-300 mx-1">{config.sourceVariableId}</span>
              <span className="text-gray-400">获取主键值</span>
            </div>
            <div>
              <span className="text-gray-400">在</span>
              <span className="text-green-300 mx-1">{config.targetFormName}</span>
              <span className="text-gray-400">中查询</span>
            </div>
            <div>
              <span className="text-gray-400">输出字段：</span>
              <span className="text-yellow-300">{outputFields.map(f => getFieldName(f)).join(', ')}</span>
            </div>
            <div>
              <span className="text-gray-400">存储到：</span>
              <span className="text-purple-300">{config.outputVariableId || '(未指定)'}</span>
            </div>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">📖 使用说明</h4>
        <div className="text-xs text-gray-400 space-y-1">
          <p>1. 选择包含主键值的输入变量</p>
          <p>2. 选择要查询的目标表单</p>
          <p>3. 选择要输出的字段（可多选）</p>
          <p>4. 设置输出变量名，查询结果将存储为键值对数组</p>
          <p>5. 必须配置"数据不存在"时的跳转节点</p>
        </div>
        <h4 className="text-sm font-medium text-gray-300 mt-3 mb-2">💡 输出格式</h4>
        <div className="bg-gray-900 rounded p-2 text-xs font-mono text-gray-300">
          <div>// 输出变量的值：</div>
          <div className="text-green-400">[{`{ "会员等级": "金卡", "省份": "广东" }`}]</div>
        </div>
        <h4 className="text-sm font-medium text-gray-300 mt-3 mb-2">💡 后续使用</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• 可接"多条件分叉"根据字段值走不同流程</li>
          <li>• 可接"写入节点"将查询结果写入其他表单</li>
        </ul>
      </div>
    </div>
  );
}

window.PropCheckConfigForm = PropCheckConfigForm;
