// 多条件分叉节点配置表单
function MultiBranchConfigForm({ node, nodes, flows, onUpdate }) {
  const config = node.config || {};
  const branches = config.branches || [
    { id: 1, label: '1号管道', target: '', targetType: 'node' },
    { id: 2, label: '2号管道', target: '', targetType: 'node' }
  ];
  
  // 获取当前流程中的其他节点（排除自己）
  const availableNodes = nodes.filter(n => n.id !== node.id);
  
  const updateConfig = (key, value) => {
    onUpdate({
      config: { ...config, [key]: value }
    });
  };

  const updateBranch = (index, updates) => {
    const newBranches = [...branches];
    newBranches[index] = { ...newBranches[index], ...updates };
    updateConfig('branches', newBranches);
  };

  const addBranch = () => {
    const newId = Math.max(...branches.map(b => b.id), 0) + 1;
    updateConfig('branches', [
      ...branches,
      { id: newId, label: `${newId}号管道`, target: '', targetType: 'node' }
    ]);
  };

  const removeBranch = (index) => {
    if (branches.length <= 2) {
      alert('至少需要保留2个管道');
      return;
    }
    const newBranches = branches.filter((_, i) => i !== index);
    updateConfig('branches', newBranches);
  };

  return (
    <div className="space-y-4">
      {/* 说明 */}
      <div className="bg-blue-900/30 border border-blue-700 rounded p-3">
        <p className="text-sm text-blue-300">
          💡 多条件分叉只定义管道数量和去向，具体的分流条件由前置的"对象属性校验"节点决定。
        </p>
      </div>

      {/* 管道数量显示 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          管道数量：{branches.length} 个
        </label>
      </div>

      {/* 管道列表 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">管道配置</label>
        
        {branches.map((branch, index) => (
          <div 
            key={branch.id} 
            className="bg-gray-700/50 border border-gray-600 rounded p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: getBranchColor(index) }}
                >
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={branch.label}
                  onChange={(e) => updateBranch(index, { label: e.target.value })}
                  className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm w-32"
                  placeholder="管道名称"
                />
              </div>
              {branches.length > 2 && (
                <button
                  onClick={() => removeBranch(index)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  删除
                </button>
              )}
            </div>

            {/* 跳转类型 */}
            <div className="flex space-x-4 mb-2">
              <label className="flex items-center text-xs text-gray-300">
                <input
                  type="radio"
                  checked={branch.targetType !== 'flow'}
                  onChange={() => updateBranch(index, { targetType: 'node', target: '' })}
                  className="mr-1"
                />
                跳转节点
              </label>
              <label className="flex items-center text-xs text-gray-300">
                <input
                  type="radio"
                  checked={branch.targetType === 'flow'}
                  onChange={() => updateBranch(index, { targetType: 'flow', target: '' })}
                  className="mr-1"
                />
                跳转流程
              </label>
            </div>

            {/* 目标选择 */}
            <select
              value={branch.target}
              onChange={(e) => updateBranch(index, { target: e.target.value })}
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            >
              <option value="">-- 选择{branch.targetType === 'flow' ? '流程' : '节点'} --</option>
              {branch.targetType === 'flow' ? (
                flows?.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))
              ) : (
                availableNodes.map(n => (
                  <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
                ))
              )}
            </select>
          </div>
        ))}

        {/* 添加管道按钮 */}
        <button
          onClick={addBranch}
          className="w-full py-2 border border-dashed border-gray-500 rounded text-gray-400 hover:text-white hover:border-gray-400 text-sm"
        >
          + 添加管道
        </button>
      </div>

      {/* 默认管道（可选） */}
      <div className="border-t border-gray-600 pt-4">
        <label className="flex items-center text-sm text-gray-300 mb-2">
          <input
            type="checkbox"
            checked={config.hasDefault || false}
            onChange={(e) => updateConfig('hasDefault', e.target.checked)}
            className="mr-2"
          />
          设置默认管道（当不满足任何条件时）
        </label>
        
        {config.hasDefault && (
          <select
            value={config.defaultBranch || ''}
            onChange={(e) => updateConfig('defaultBranch', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          >
            <option value="">-- 选择默认管道 --</option>
            {branches.map((branch, index) => (
              <option key={branch.id} value={branch.id}>
                {index + 1}号: {branch.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 预览 */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">分叉预览</h4>
        <div className="bg-gray-900 rounded p-3 text-xs">
          <div className="flex items-center justify-center mb-3">
            <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center text-white">
              ◆
            </div>
          </div>
          <div className="flex justify-center space-x-2 flex-wrap">
            {branches.map((branch, index) => (
              <div 
                key={branch.id}
                className="flex flex-col items-center"
              >
                <div 
                  className="w-1 h-4"
                  style={{ backgroundColor: getBranchColor(index) }}
                />
                <div 
                  className="px-2 py-1 rounded text-white text-xs"
                  style={{ backgroundColor: getBranchColor(index) }}
                >
                  {branch.label}
                </div>
                <div className="text-gray-500 text-xs mt-1 truncate max-w-[80px]">
                  → {branch.target || '未指定'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 获取管道颜色
function getBranchColor(index) {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // yellow
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#F97316', // orange
  ];
  return colors[index % colors.length];
}

window.MultiBranchConfigForm = MultiBranchConfigForm;
