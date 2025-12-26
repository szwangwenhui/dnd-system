// 流程跳转节点配置表单
// 功能：跳转到另一个数据流程
function JumpConfigForm({ 
  node, 
  onUpdate,
  projectId,
  flowId
}) {
  const config = node.config || {};
  const params = config.params || [];
  
  // 可跳转的流程列表（开始节点包含flowTrigger触发方式的流程）
  const [availableFlows, setAvailableFlows] = React.useState([]);
  const [allFlows, setAllFlows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  // 加载流程列表
  React.useEffect(() => {
    if (projectId) {
      loadFlows();
    }
  }, [projectId]);

  const loadFlows = async () => {
    setLoading(true);
    try {
      const flows = await window.dndDB.getDataFlowsByProjectId(projectId);
      setAllFlows(flows || []);
      
      // 筛选出可被其他流程触发的流程（排除当前流程）
      const targetFlows = (flows || []).filter(f => {
        if (f.id === flowId) return false;  // 排除当前流程
        
        // 检查开始节点是否配置了flowTrigger触发方式
        const startNode = f.design?.nodes?.find(n => n.type === 'start');
        if (!startNode) return true;  // 如果没有开始节点配置，默认可跳转
        
        const triggerTypes = startNode.config?.triggerTypes || [startNode.config?.triggerType];
        return triggerTypes.includes('flowTrigger') || triggerTypes.length === 0;
      });
      
      setAvailableFlows(targetFlows);
    } catch (error) {
      console.error('加载流程列表失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateConfig = (key, value) => {
    onUpdate({
      config: { ...config, [key]: value }
    });
  };

  // 选择目标流程
  const handleSelectFlow = (targetFlowId) => {
    const flow = allFlows.find(f => f.id === targetFlowId);
    updateConfig('targetFlowId', targetFlowId);
    updateConfig('targetFlowName', flow?.name || '');
  };

  // 添加参数
  const addParam = () => {
    updateConfig('params', [
      ...params,
      { id: Date.now(), name: '', valueType: 'fixed', value: '' }
    ]);
  };

  // 更新参数
  const updateParam = (index, updates) => {
    const newParams = [...params];
    newParams[index] = { ...newParams[index], ...updates };
    updateConfig('params', newParams);
  };

  // 删除参数
  const removeParam = (index) => {
    updateConfig('params', params.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* 说明 */}
      <div className="bg-purple-900/30 border border-purple-700 rounded p-3">
        <p className="text-sm text-purple-300">
          ↗ 流程跳转：跳转到另一个数据流程执行
        </p>
        <p className="text-xs text-purple-400 mt-1">
          跳转后本流程结束，目标流程需在开始节点勾选"其它流程触发"
        </p>
      </div>

      {/* 目标流程 */}
      <div className="bg-blue-900/30 p-3 rounded border border-blue-700">
        <label className="block text-sm font-medium text-blue-300 mb-2">
          🎯 目标流程 <span className="text-red-400">*</span>
        </label>
        {loading ? (
          <div className="text-sm text-gray-400">加载中...</div>
        ) : availableFlows.length === 0 ? (
          <div className="text-sm text-yellow-400">
            ⚠️ 暂无可跳转的流程。请确保目标流程的开始节点勾选了"其它流程触发"
          </div>
        ) : (
          <select
            value={config.targetFlowId || ''}
            onChange={(e) => handleSelectFlow(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          >
            <option value="">-- 选择流程 --</option>
            {availableFlows.map(flow => (
              <option key={flow.id} value={flow.id}>{flow.name} ({flow.id})</option>
            ))}
          </select>
        )}
        {config.targetFlowId && (
          <div className="mt-2 text-xs text-gray-400">
            将跳转到流程：<span className="text-blue-300">{config.targetFlowName}</span>
          </div>
        )}
      </div>

      {/* 传递参数（可选） */}
      <div className="bg-gray-800 p-3 rounded border border-gray-600">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          📦 传递参数（可选）
        </label>
        <p className="text-xs text-gray-400 mb-3">
          可以将当前流程的变量传递给目标流程
        </p>
        
        {params.length > 0 && (
          <div className="space-y-2 mb-3">
            {params.map((param, index) => (
              <div key={param.id} className="flex items-center space-x-2 bg-gray-700/50 p-2 rounded">
                {/* 参数名 */}
                <input
                  type="text"
                  value={param.name}
                  onChange={(e) => updateParam(index, { name: e.target.value })}
                  placeholder="参数名"
                  className="w-24 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
                
                <span className="text-gray-500">=</span>
                
                {/* 值类型 */}
                <select
                  value={param.valueType}
                  onChange={(e) => updateParam(index, { valueType: e.target.value, value: '' })}
                  className="w-24 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                >
                  <option value="fixed">固定值</option>
                  <option value="variable">变量值</option>
                </select>
                
                {/* 值 */}
                <input
                  type="text"
                  value={param.value}
                  onChange={(e) => updateParam(index, { value: e.target.value })}
                  placeholder={param.valueType === 'fixed' ? '输入值' : '变量名'}
                  className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
                
                {/* 删除 */}
                <button
                  onClick={() => removeParam(index)}
                  className="text-red-400 hover:text-red-300 px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        
        <button
          onClick={addParam}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          + 添加参数
        </button>
      </div>

      {/* 预览 */}
      {config.targetFlowId && (
        <div className="bg-gray-700/30 p-3 rounded">
          <div className="text-xs text-gray-400 mb-1">跳转预览：</div>
          <div className="text-sm font-mono">
            <div className="text-white">
              <span className="text-purple-400">↗</span> 跳转到流程 
              <span className="text-blue-300 ml-1">{config.targetFlowName}</span>
            </div>
            {params.length > 0 && (
              <div className="mt-1 pl-4 text-gray-400 text-xs">
                携带参数：
                {params.map((p, i) => (
                  <span key={i} className="ml-2">
                    <span className="text-yellow-300">{p.name}</span>=
                    {p.valueType === 'variable' 
                      ? <span className="text-green-300">{`{${p.value}}`}</span>
                      : <span className="text-gray-300">"{p.value}"</span>
                    }
                  </span>
                ))}
              </div>
            )}
            <div className="mt-1 pl-4 text-red-300 text-xs">
              ⚠ 本流程在此结束
            </div>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">📖 使用说明</h4>
        <div className="text-xs text-gray-400 space-y-1">
          <p>1. 选择要跳转的目标流程</p>
          <p>2. 目标流程需在开始节点勾选"其它流程触发"</p>
          <p>3. 可传递参数给目标流程使用</p>
          <p>4. 跳转后本流程结束，不再执行后续节点</p>
        </div>
        <h4 className="text-sm font-medium text-gray-300 mt-3 mb-2">💡 与页面跳转的区别</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• <strong>页面跳转</strong>：在结束节点配置，用于流程结束后跳转页面</li>
          <li>• <strong>流程跳转</strong>：在流程中途跳转到另一个流程继续执行</li>
        </ul>
      </div>
    </div>
  );
}

window.JumpConfigForm = JumpConfigForm;
