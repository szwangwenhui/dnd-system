// 是非分叉节点配置表单
// 功能：根据布尔值变量决定走两个分支之一
function BinaryBranchConfigForm({ 
  node, 
  nodes, 
  onUpdate,
  projectId,
  flowId
}) {
  const config = node.config || {};
  
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

  // 过滤出布尔值类型的变量
  // 布尔值变量通常来自：存在性校验的输出
  const booleanVariables = variables.filter(v => 
    v.dataType === 'boolean' || 
    v.dataType === 'value' ||  // 单值也可能是布尔
    v.sourceType === 'existCheck'  // 存在性校验的输出
  );

  return (
    <div className="space-y-4">
      {/* 说明 */}
      <div className="bg-yellow-900/30 border border-yellow-700 rounded p-3">
        <p className="text-sm text-yellow-300">
          ◇ 是非分叉：根据布尔值变量（true/false）决定走哪个分支
        </p>
        <p className="text-xs text-yellow-400 mt-1">
          布尔值通常来自"存在性校验"的输出结果
        </p>
      </div>

      {/* 输入变量选择 */}
      <div className="bg-blue-900/30 p-3 rounded border border-blue-700">
        <label className="block text-sm font-medium text-blue-300 mb-2">
          📦 输入变量（布尔值）<span className="text-red-400">*</span>
        </label>
        {loadingVars ? (
          <div className="text-sm text-gray-400">加载中...</div>
        ) : variables.length === 0 ? (
          <div className="text-sm text-yellow-400">
            ⚠️ 暂无可用变量，请先添加存在性校验或其他产生布尔值的节点
          </div>
        ) : (
          <select
            value={config.sourceVariableId || ''}
            onChange={(e) => handleSelectVariable(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          >
            <option value="">-- 选择布尔值变量 --</option>
            {/* 优先显示布尔值变量 */}
            {booleanVariables.length > 0 && (
              <optgroup label="布尔值变量">
                {booleanVariables.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.id} {v.name ? `(${v.name})` : ''} 
                    {v.sourceType === 'existCheck' ? ' [存在性校验]' : ' [布尔值]'}
                  </option>
                ))}
              </optgroup>
            )}
            {/* 其他变量 */}
            {variables.filter(v => !booleanVariables.includes(v)).length > 0 && (
              <optgroup label="其他变量（可能需要转换）">
                {variables.filter(v => !booleanVariables.includes(v)).map(v => (
                  <option key={v.id} value={v.id}>
                    {v.id} {v.name ? `(${v.name})` : ''} [{v.dataType}]
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        )}
        {config.sourceVariableId && (
          <div className="mt-2 text-xs text-gray-400">
            将根据变量 <span className="text-blue-300">{config.sourceVariableId}</span> 的值进行分叉
          </div>
        )}
      </div>

      {/* 分支配置 */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-3">分支跳转</h4>
        
        <div className="grid grid-cols-2 gap-4">
          {/* true分支 */}
          <div className="bg-green-900/30 p-3 rounded border border-green-700">
            <label className="block text-sm font-medium text-green-400 mb-2">
              ✓ true（是）→ 跳转到
            </label>
            <select
              value={config.trueNodeId || ''}
              onChange={(e) => updateConfig('trueNodeId', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            >
              <option value="">-- 通过连线指定 --</option>
              {availableNodes.map(n => (
                <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
              ))}
            </select>
          </div>
          
          {/* false分支 */}
          <div className="bg-red-900/30 p-3 rounded border border-red-700">
            <label className="block text-sm font-medium text-red-400 mb-2">
              ✗ false（否）→ 跳转到
            </label>
            <select
              value={config.falseNodeId || ''}
              onChange={(e) => updateConfig('falseNodeId', e.target.value)}
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

      {/* 逻辑预览 */}
      {config.sourceVariableId && (
        <div className="bg-gray-700/30 p-3 rounded">
          <div className="text-xs text-gray-400 mb-1">分叉逻辑预览：</div>
          <div className="text-sm font-mono">
            <div className="text-white">
              如果 <span className="text-blue-300">{config.sourceVariableId}</span> 为
            </div>
            <div className="pl-4 mt-1">
              <span className="text-green-400">true</span> → 
              <span className="text-green-300 ml-1">{config.trueNodeId || '(连线指定)'}</span>
            </div>
            <div className="pl-4">
              <span className="text-red-400">false</span> → 
              <span className="text-red-300 ml-1">{config.falseNodeId || '(连线指定)'}</span>
            </div>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">📖 使用说明</h4>
        <div className="text-xs text-gray-400 space-y-1">
          <p>1. 选择一个布尔值变量作为判断依据</p>
          <p>2. 配置 true 和 false 时分别跳转到哪个节点</p>
          <p>3. 也可以不在此配置，直接通过画布连线指定</p>
        </div>
        <h4 className="text-sm font-medium text-gray-300 mt-3 mb-2">💡 常见场景</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• 存在性校验后，存在/不存在走不同流程</li>
          <li>• 条件判断后，满足/不满足走不同流程</li>
        </ul>
      </div>
    </div>
  );
}

window.BinaryBranchConfigForm = BinaryBranchConfigForm;
