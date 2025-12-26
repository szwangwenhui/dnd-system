// 多条件分叉节点配置表单
// 功能：根据变量值匹配跳转到对应节点
function MultiBranchConfigForm({ 
  node, 
  nodes, 
  onUpdate,
  projectId,
  flowId
}) {
  const config = node.config || {};
  const matchRules = config.matchRules || [];
  
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

  // 选择变量
  const handleSelectVariable = async (variableId) => {
    if (node.id && flowId && projectId && variableId) {
      try {
        await window.dndDB.addVariableUsage(projectId, variableId, node.id, flowId);
      } catch (error) {
        console.error('记录变量使用失败:', error);
      }
    }
    updateConfig('sourceVariableId', variableId);
  };

  // 添加匹配规则
  const addMatchRule = () => {
    updateConfig('matchRules', [
      ...matchRules,
      { id: Date.now(), value: '', nodeId: '' }
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

  // 获取数据类型文本
  const getDataTypeText = (type) => {
    switch (type) {
      case 'array': return '数组';
      case 'object': return '对象';
      case 'value': return '单值';
      case 'boolean': return '布尔值';
      default: return type || '未知';
    }
  };

  // 获取颜色
  const getColor = (index) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-4">
      {/* 说明 */}
      <div className="bg-orange-900/30 border border-orange-700 rounded p-3">
        <p className="text-sm text-orange-300">
          ◆ 多条件分叉：根据变量的值匹配跳转到对应节点
        </p>
        <p className="text-xs text-orange-400 mt-1">
          输入变量可以来自页面读取、属性校验、或其他节点的输出
        </p>
      </div>

      {/* 输入变量选择 */}
      <div className="bg-blue-900/30 p-3 rounded border border-blue-700">
        <label className="block text-sm font-medium text-blue-300 mb-2">
          📦 输入变量<span className="text-red-400">*</span>
        </label>
        {loadingVars ? (
          <div className="text-sm text-gray-400">加载中...</div>
        ) : variables.length === 0 ? (
          <div className="text-sm text-yellow-400">
            ⚠️ 暂无可用变量，请先添加读取节点或其他产生输出的节点
          </div>
        ) : (
          <select
            value={config.sourceVariableId || ''}
            onChange={(e) => handleSelectVariable(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          >
            <option value="">-- 选择变量 --</option>
            {variables.map(v => (
              <option key={v.id} value={v.id}>
                {v.id} {v.name ? `(${v.name})` : ''} [{getDataTypeText(v.dataType)}]
              </option>
            ))}
          </select>
        )}
        {config.sourceVariableId && (
          <div className="mt-2 text-xs text-gray-400">
            将根据变量 <span className="text-blue-300">{config.sourceVariableId}</span> 的值进行匹配分叉
          </div>
        )}
      </div>

      {/* 匹配规则 */}
      <div className="bg-gray-800 p-3 rounded border border-gray-600">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          🔀 匹配规则
        </label>
        <p className="text-xs text-gray-400 mb-3">
          设置变量值与目标节点的对应关系
        </p>
        
        {matchRules.length > 0 && (
          <div className="space-y-2 mb-3">
            {matchRules.map((rule, index) => (
              <div key={rule.id} className="flex items-center space-x-2 bg-gray-700/50 p-2 rounded">
                {/* 颜色标识 */}
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getColor(index) }}
                />
                
                {/* 值输入 */}
                <div className="flex items-center space-x-1 flex-1">
                  <span className="text-gray-400 text-sm">值 =</span>
                  <input
                    type="text"
                    value={rule.value}
                    onChange={(e) => updateMatchRule(index, { value: e.target.value })}
                    placeholder="如：确认、金卡、A"
                    className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
                
                {/* 箭头 */}
                <span className="text-gray-400">→</span>
                
                {/* 目标节点 */}
                <select
                  value={rule.nodeId}
                  onChange={(e) => updateMatchRule(index, { nodeId: e.target.value })}
                  className="w-40 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                >
                  <option value="">选择节点</option>
                  {availableNodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
                  ))}
                </select>
                
                {/* 删除按钮 */}
                <button
                  onClick={() => removeMatchRule(index)}
                  className="text-red-400 hover:text-red-300 px-1"
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

      {/* 默认节点（必配） */}
      <div className="bg-red-900/30 p-3 rounded border border-red-700">
        <label className="block text-sm font-medium text-red-300 mb-2">
          ⚠️ 默认跳转（都不匹配时）<span className="text-red-400">*</span>
        </label>
        <select
          value={config.defaultNodeId || ''}
          onChange={(e) => updateConfig('defaultNodeId', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        >
          <option value="">-- 选择默认节点 --</option>
          {availableNodes.map(n => (
            <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
          ))}
        </select>
        <div className="mt-2 text-xs text-red-300">
          当变量值与所有规则都不匹配时，将跳转到此节点
        </div>
      </div>

      {/* 逻辑预览 */}
      {config.sourceVariableId && matchRules.length > 0 && (
        <div className="bg-gray-700/30 p-3 rounded">
          <div className="text-xs text-gray-400 mb-1">分叉逻辑预览：</div>
          <div className="text-sm font-mono">
            <div className="text-white mb-1">
              根据 <span className="text-blue-300">{config.sourceVariableId}</span> 的值：
            </div>
            {matchRules.map((rule, index) => (
              <div key={rule.id} className="pl-4 flex items-center space-x-2">
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getColor(index) }}
                />
                <span className="text-yellow-300">"{rule.value || '?'}"</span>
                <span className="text-gray-400">→</span>
                <span className="text-green-300">{rule.nodeId || '(未指定)'}</span>
              </div>
            ))}
            <div className="pl-4 flex items-center space-x-2 text-red-300">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>其他</span>
              <span className="text-gray-400">→</span>
              <span>{config.defaultNodeId || '(未指定)'}</span>
            </div>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">📖 使用说明</h4>
        <div className="text-xs text-gray-400 space-y-1">
          <p>1. 选择要判断的变量</p>
          <p>2. 添加匹配规则：当变量值等于某个值时，跳转到指定节点</p>
          <p>3. 必须配置默认节点：当所有规则都不匹配时的去向</p>
        </div>
        <h4 className="text-sm font-medium text-gray-300 mt-3 mb-2">💡 常见场景</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• 页面按钮点击：确认/取消/其他</li>
          <li>• 属性校验后：金卡/银卡/普卡走不同流程</li>
          <li>• 省份/地区：根据地区走不同处理逻辑</li>
        </ul>
      </div>
    </div>
  );
}

window.MultiBranchConfigForm = MultiBranchConfigForm;
