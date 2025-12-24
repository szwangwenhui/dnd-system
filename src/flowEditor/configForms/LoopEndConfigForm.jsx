// 循环结束节点配置表单
function LoopEndConfigForm({ config, onChange, nodes }) {
  const defaultConfig = {
    loopStartNodeId: ''
  };

  const [localConfig, setLocalConfig] = React.useState({
    ...defaultConfig,
    ...config
  });

  const updateConfig = (key, value) => {
    setLocalConfig(prev => {
      const newConfig = { ...prev, [key]: value };
      onChange(newConfig);
      return newConfig;
    });
  };

  // 获取循环开始节点
  const getLoopStartNodes = () => {
    return (nodes || []).filter(n => n.type === 'loopStart');
  };

  // 获取已关联的循环开始节点信息
  const getLinkedStartNode = () => {
    if (!localConfig.loopStartNodeId) return null;
    return (nodes || []).find(n => n.id === localConfig.loopStartNodeId);
  };

  const linkedStartNode = getLinkedStartNode();

  return (
    <div className="space-y-4">
      {/* 关联的循环开始节点 */}
      <div className="bg-gray-700 rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-medium text-gray-300">关联设置</h4>
        
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            对应的循环开始节点 <span className="text-red-400">*</span>
          </label>
          <select
            value={localConfig.loopStartNodeId}
            onChange={(e) => updateConfig('loopStartNodeId', e.target.value)}
            className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-purple-500 focus:outline-none"
          >
            <option value="">-- 选择循环开始节点 --</option>
            {getLoopStartNodes().map(n => {
              const cfg = n.config || {};
              const loopType = cfg.loopType === 'forEach' ? '遍历' : '条件';
              return (
                <option key={n.id} value={n.id}>
                  {n.id} ({n.name || '循环开始'}) - {loopType}
                </option>
              );
            })}
          </select>
          
          {getLoopStartNodes().length === 0 && (
            <p className="text-xs text-yellow-500 mt-1">
              💡 请先添加"循环开始"节点
            </p>
          )}
        </div>
      </div>

      {/* 显示关联的循环信息 */}
      {linkedStartNode && (
        <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-purple-300 mb-2">📋 循环信息</h4>
          <div className="text-xs text-purple-400 space-y-1">
            {linkedStartNode.config?.loopType === 'forEach' ? (
              <>
                <p><strong>循环方式：</strong>遍历对象</p>
                <p><strong>数据来源：</strong>{linkedStartNode.config?.forEachConfig?.sourceVarName || linkedStartNode.config?.forEachConfig?.sourceVar || '未设置'}</p>
                <p><strong>当前项变量：</strong>${linkedStartNode.config?.forEachConfig?.itemVar || 'item'}</p>
                {linkedStartNode.config?.forEachConfig?.indexVar && (
                  <p><strong>索引变量：</strong>${linkedStartNode.config?.forEachConfig?.indexVar}</p>
                )}
              </>
            ) : (
              <>
                <p><strong>循环方式：</strong>条件循环</p>
                <p><strong>最大次数：</strong>{linkedStartNode.config?.whileConfig?.maxCount || 100}</p>
                <p><strong>计数变量：</strong>${linkedStartNode.config?.whileConfig?.countVar || 'loopCount'}</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* 执行说明 */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">⚙️ 执行逻辑</h4>
        <div className="text-xs text-gray-400 space-y-1">
          <p>1. 执行到此节点时，检查循环条件</p>
          <p>2. 如果条件满足，跳回循环开始节点继续循环</p>
          <p>3. 如果条件不满足，继续执行后续节点</p>
          <p>4. 如果收到"跳出"信号，直接结束循环</p>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
        <div className="text-xs text-blue-300">
          <strong>💡 提示</strong>
          <p className="mt-1 text-blue-400">
            循环结束节点必须与循环开始节点配对使用，
            两者之间的节点构成循环体。
          </p>
        </div>
      </div>
    </div>
  );
}

window.LoopEndConfigForm = LoopEndConfigForm;
