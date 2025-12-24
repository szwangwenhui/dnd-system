// 子流程调用节点配置表单
function SubFlowConfigForm({ node, dataFlows, onUpdate }) {
  const config = node.config || {};
  const params = config.params || [];
  
  const updateConfig = (key, value) => {
    onUpdate({
      config: { ...config, [key]: value }
    });
  };

  // 添加参数
  const addParam = () => {
    updateConfig('params', [...params, { id: Date.now(), name: '', valueType: 'variable', value: '' }]);
  };

  const updateParam = (index, updates) => {
    const newParams = [...params];
    newParams[index] = { ...newParams[index], ...updates };
    updateConfig('params', newParams);
  };

  const removeParam = (index) => {
    updateConfig('params', params.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* 目标流程 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          目标流程 <span className="text-red-400">*</span>
        </label>
        <select
          value={config.flowId || ''}
          onChange={(e) => {
            const flow = dataFlows?.find(f => f.id === e.target.value);
            updateConfig('flowId', e.target.value);
            updateConfig('flowName', flow?.name || '');
          }}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        >
          <option value="">-- 选择流程 --</option>
          {dataFlows?.map(flow => (
            <option key={flow.id} value={flow.id}>{flow.name}</option>
          ))}
        </select>
      </div>

      {/* 传入参数 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">传入参数（可选）</label>
        {params.length > 0 && (
          <div className="space-y-2 mb-2">
            {params.map((param, index) => (
              <div key={param.id} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={param.name}
                  onChange={(e) => updateParam(index, { name: e.target.value })}
                  placeholder="参数名"
                  className="w-28 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
                <span className="text-gray-500">=</span>
                <select
                  value={param.valueType}
                  onChange={(e) => updateParam(index, { valueType: e.target.value })}
                  className="w-20 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                >
                  <option value="variable">变量</option>
                  <option value="fixed">固定</option>
                </select>
                <input
                  type="text"
                  value={param.value}
                  onChange={(e) => updateParam(index, { value: e.target.value })}
                  placeholder={param.valueType === 'variable' ? 'user.id' : '值'}
                  className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
                <button onClick={() => removeParam(index)} className="text-red-400 hover:text-red-300">✕</button>
              </div>
            ))}
          </div>
        )}
        <button onClick={addParam} className="text-sm text-blue-400 hover:text-blue-300">+ 添加参数</button>
      </div>

      {/* 返回值 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">返回值（如果子流程有返回）</label>
        <input
          type="text"
          value={config.outputVar || ''}
          onChange={(e) => updateConfig('outputVar', e.target.value)}
          placeholder="存入变量名，如：subResult"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono"
        />
      </div>

      {/* 调用方式 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">调用方式</label>
        <div className="space-y-2">
          <label className="flex items-start p-3 rounded border-2 cursor-pointer transition-all bg-gray-700/50 border-gray-600 hover:border-gray-500">
            <input
              type="radio"
              checked={config.callMode !== 'async'}
              onChange={() => updateConfig('callMode', 'sync')}
              className="mt-0.5 mr-3"
            />
            <div>
              <div className="text-sm text-white font-medium">同步调用</div>
              <div className="text-xs text-gray-400">等待子流程完成后继续执行</div>
            </div>
          </label>
          <label className="flex items-start p-3 rounded border-2 cursor-pointer transition-all bg-gray-700/50 border-gray-600 hover:border-gray-500">
            <input
              type="radio"
              checked={config.callMode === 'async'}
              onChange={() => updateConfig('callMode', 'async')}
              className="mt-0.5 mr-3"
            />
            <div>
              <div className="text-sm text-white font-medium">异步调用</div>
              <div className="text-xs text-gray-400">触发后立即继续，不等待子流程完成</div>
            </div>
          </label>
        </div>
      </div>

      {/* 预览 */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">调用预览</h4>
        <div className="bg-gray-900 rounded p-3 text-sm font-mono">
          <div className="text-purple-400">
            ▣ {config.callMode === 'async' ? '异步' : '同步'}调用 
            <span className="text-white"> [{config.flowName || '???'}]</span>
          </div>
          {params.length > 0 && (
            <div className="text-gray-500 pl-4 mt-1">
              参数: {params.map(p => `${p.name}=${p.valueType === 'variable' ? p.value : `"${p.value}"`}`).join(', ')}
            </div>
          )}
          {config.outputVar && (
            <div className="text-gray-500 pl-4">
              返回 → <span className="text-green-400">{config.outputVar}</span>
            </div>
          )}
        </div>
      </div>

      {/* 使用场景 */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">常见使用场景</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• 下单后调用"发送通知"子流程</li>
          <li>• 复用"检查权限"流程</li>
          <li>• 批量处理时调用"处理单条"子流程</li>
        </ul>
      </div>
    </div>
  );
}

window.SubFlowConfigForm = SubFlowConfigForm;
