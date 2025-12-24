// 等待节点配置表单
function WaitConfigForm({ node, nodes, onUpdate }) {
  const config = node.config || {};
  
  const availableNodes = nodes.filter(n => n.id !== node.id);
  
  const updateConfig = (key, value) => {
    onUpdate({
      config: { ...config, [key]: value }
    });
  };

  return (
    <div className="space-y-4">
      {/* 等待方式 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          等待方式 <span className="text-red-400">*</span>
        </label>
        <div className="space-y-2">
          <label className="flex items-center text-sm text-gray-300 p-2 rounded hover:bg-gray-700 cursor-pointer">
            <input
              type="radio"
              checked={config.waitType === 'duration' || !config.waitType}
              onChange={() => updateConfig('waitType', 'duration')}
              className="mr-3"
            />
            <div>
              <span className="font-medium">⏱ 固定时长</span>
              <p className="text-xs text-gray-500">等待指定的时间后继续</p>
            </div>
          </label>
          <label className="flex items-center text-sm text-gray-300 p-2 rounded hover:bg-gray-700 cursor-pointer">
            <input
              type="radio"
              checked={config.waitType === 'condition'}
              onChange={() => updateConfig('waitType', 'condition')}
              className="mr-3"
            />
            <div>
              <span className="font-medium">⏸ 等待条件满足</span>
              <p className="text-xs text-gray-500">定期检查条件，满足后继续</p>
            </div>
          </label>
        </div>
      </div>

      {/* 固定时长配置 */}
      {(config.waitType === 'duration' || !config.waitType) && (
        <div className="border border-blue-600 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-blue-400">固定时长配置</h4>
          
          <div className="flex items-center space-x-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">时长</label>
              <input
                type="number"
                value={config.duration || 1}
                onChange={(e) => updateConfig('duration', parseInt(e.target.value) || 1)}
                min="1"
                className="w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">单位</label>
              <select
                value={config.durationUnit || 'seconds'}
                onChange={(e) => updateConfig('durationUnit', e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              >
                <option value="seconds">秒</option>
                <option value="minutes">分钟</option>
                <option value="hours">小时</option>
                <option value="days">天</option>
              </select>
            </div>
          </div>
          
          <p className="text-xs text-gray-500">
            💡 常用场景：发送验证码后等待60秒才能重发
          </p>
        </div>
      )}

      {/* 等待条件配置 */}
      {config.waitType === 'condition' && (
        <div className="border border-yellow-600 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-yellow-400">等待条件配置</h4>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              检查条件 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={config.condition || ''}
              onChange={(e) => updateConfig('condition', e.target.value)}
              placeholder="如：order.status == '已支付'"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">检查间隔</label>
              <input
                type="number"
                value={config.checkInterval || 5}
                onChange={(e) => updateConfig('checkInterval', parseInt(e.target.value) || 5)}
                min="1"
                className="w-20 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              />
            </div>
            <div className="pt-5 text-sm text-gray-400">秒</div>
          </div>
          
          <div className="border-t border-gray-600 pt-3">
            <label className="block text-xs text-gray-400 mb-2">超时设置</label>
            <div className="flex items-center space-x-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">最长等待</label>
                <input
                  type="number"
                  value={config.timeout || 30}
                  onChange={(e) => updateConfig('timeout', parseInt(e.target.value) || 30)}
                  min="1"
                  className="w-20 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">单位</label>
                <select
                  value={config.timeoutUnit || 'minutes'}
                  onChange={(e) => updateConfig('timeoutUnit', e.target.value)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                >
                  <option value="seconds">秒</option>
                  <option value="minutes">分钟</option>
                  <option value="hours">小时</option>
                </select>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">超时后 → 跳转到</label>
            <select
              value={config.timeoutNode || ''}
              onChange={(e) => updateConfig('timeoutNode', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            >
              <option value="">-- 结束流程 --</option>
              {availableNodes.map(n => (
                <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
              ))}
            </select>
          </div>
          
          <p className="text-xs text-gray-500">
            💡 常用场景：等待支付回调（最长等待30分钟）
          </p>
        </div>
      )}

      {/* 预览 */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">等待预览</h4>
        <div className="bg-gray-900 rounded p-3 text-xs">
          {(config.waitType === 'duration' || !config.waitType) && (
            <div className="flex items-center space-x-2">
              <span className="text-2xl">⏱</span>
              <div>
                <div className="text-blue-400">
                  等待 {config.duration || 1} {
                    config.durationUnit === 'minutes' ? '分钟' :
                    config.durationUnit === 'hours' ? '小时' :
                    config.durationUnit === 'days' ? '天' : '秒'
                  }
                </div>
                <div className="text-gray-500">然后继续下一节点</div>
              </div>
            </div>
          )}
          {config.waitType === 'condition' && (
            <div className="space-y-1">
              <div className="text-yellow-400">
                ⏸ 等待条件: {config.condition || '???'}
              </div>
              <div className="text-gray-500 pl-4">
                每 {config.checkInterval || 5} 秒检查一次
              </div>
              <div className="text-gray-500 pl-4">
                超时: {config.timeout || 30} {
                  config.timeoutUnit === 'seconds' ? '秒' :
                  config.timeoutUnit === 'hours' ? '小时' : '分钟'
                } → {config.timeoutNode || '结束流程'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

window.WaitConfigForm = WaitConfigForm;
