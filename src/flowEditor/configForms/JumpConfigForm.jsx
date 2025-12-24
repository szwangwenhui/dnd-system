// 页面跳转节点配置表单
function JumpConfigForm({ node, pages, nodes, onUpdate }) {
  const config = node.config || {};
  const params = config.params || [];
  
  const availableNodes = nodes.filter(n => n.id !== node.id);
  
  const updateConfig = (key, value) => {
    onUpdate({
      config: { ...config, [key]: value }
    });
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
      {/* 目标页面 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          目标页面 <span className="text-red-400">*</span>
        </label>
        <select
          value={config.targetPage || ''}
          onChange={(e) => updateConfig('targetPage', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        >
          <option value="">-- 选择页面 --</option>
          {pages?.map(page => (
            <option key={page.id} value={page.id}>{page.name}</option>
          ))}
        </select>
      </div>

      {/* 打开方式 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">打开方式</label>
        <div className="space-y-2">
          <label className="flex items-center text-sm text-gray-300">
            <input
              type="radio"
              checked={config.openMode === 'replace' || !config.openMode}
              onChange={() => updateConfig('openMode', 'replace')}
              className="mr-2"
            />
            <span className="flex items-center">
              <span className="mr-2">📄</span>
              替换当前页（离开当前页）
            </span>
          </label>
          <label className="flex items-center text-sm text-gray-300">
            <input
              type="radio"
              checked={config.openMode === 'newWindow'}
              onChange={() => updateConfig('openMode', 'newWindow')}
              className="mr-2"
            />
            <span className="flex items-center">
              <span className="mr-2">🗗</span>
              新窗口打开
            </span>
          </label>
          <label className="flex items-center text-sm text-gray-300">
            <input
              type="radio"
              checked={config.openMode === 'modal'}
              onChange={() => updateConfig('openMode', 'modal')}
              className="mr-2"
            />
            <span className="flex items-center">
              <span className="mr-2">⬚</span>
              弹窗打开（模态框）
            </span>
          </label>
        </div>
      </div>

      {/* 传入参数 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          传入参数（可选）
        </label>
        
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
                  placeholder={param.valueType === 'fixed' ? '输入值' : '如: order.id'}
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

      {/* 跳转后本流程行为 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">跳转后本流程</label>
        <div className="space-y-2">
          <label className="flex items-center text-sm text-gray-300">
            <input
              type="radio"
              checked={config.afterJump === 'end' || !config.afterJump}
              onChange={() => updateConfig('afterJump', 'end')}
              className="mr-2"
            />
            结束（跳转即结束流程）
          </label>
          <label className="flex items-center text-sm text-gray-300">
            <input
              type="radio"
              checked={config.afterJump === 'continue'}
              onChange={() => updateConfig('afterJump', 'continue')}
              className="mr-2"
            />
            继续（弹窗关闭后继续下一节点）
          </label>
        </div>
        
        {config.afterJump === 'continue' && (
          <p className="text-xs text-yellow-500 mt-2">
            ⚠ 仅在"弹窗打开"模式下有效
          </p>
        )}
      </div>

      {/* 预览 */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">跳转预览</h4>
        <div className="bg-gray-900 rounded p-3 text-sm">
          <div className="flex items-center space-x-2 text-gray-300">
            <span className="text-green-400">⬚→</span>
            <span>跳转到</span>
            <span className="text-blue-400 font-medium">
              {pages?.find(p => p.id === config.targetPage)?.name || '未选择页面'}
            </span>
          </div>
          
          {params.length > 0 && (
            <div className="mt-2 pl-6 text-xs text-gray-500">
              携带参数：
              {params.map((p, i) => (
                <span key={i} className="ml-2">
                  {p.name}={p.valueType === 'variable' ? `{${p.value}}` : `"${p.value}"`}
                </span>
              ))}
            </div>
          )}
          
          <div className="mt-2 pl-6 text-xs text-gray-500">
            打开方式：
            {config.openMode === 'newWindow' && '新窗口'}
            {config.openMode === 'modal' && '弹窗'}
            {(!config.openMode || config.openMode === 'replace') && '替换当前页'}
          </div>
        </div>
      </div>
    </div>
  );
}

window.JumpConfigForm = JumpConfigForm;
