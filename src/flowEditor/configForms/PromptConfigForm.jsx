// 提示节点配置表单
function PromptConfigForm({ node, nodes, onUpdate }) {
  const config = node.config || {};
  
  const availableNodes = nodes.filter(n => n.id !== node.id);
  
  const updateConfig = (key, value) => {
    onUpdate({
      config: { ...config, [key]: value }
    });
  };

  // 提示类型选项
  const promptTypes = [
    { value: 'success', label: '成功', icon: '✓', color: 'green' },
    { value: 'error', label: '错误', icon: '✗', color: 'red' },
    { value: 'warning', label: '警告', icon: '⚠', color: 'yellow' },
    { value: 'info', label: '信息', icon: 'ℹ', color: 'blue' },
    { value: 'confirm', label: '确认框', icon: '?', color: 'purple' }
  ];

  const getTypeColor = (type) => {
    const colors = {
      success: 'bg-green-600 border-green-500',
      error: 'bg-red-600 border-red-500',
      warning: 'bg-yellow-600 border-yellow-500',
      info: 'bg-blue-600 border-blue-500',
      confirm: 'bg-purple-600 border-purple-500'
    };
    return colors[type] || colors.info;
  };

  return (
    <div className="space-y-4">
      {/* 提示类型 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          提示类型 <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-5 gap-2">
          {promptTypes.map(type => (
            <button
              key={type.value}
              onClick={() => updateConfig('promptType', type.value)}
              className={`p-2 rounded border-2 text-center transition-all ${
                config.promptType === type.value
                  ? getTypeColor(type.value) + ' text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="text-lg">{type.icon}</div>
              <div className="text-xs mt-1">{type.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 提示内容 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          提示内容 <span className="text-red-400">*</span>
        </label>
        <textarea
          value={config.message || ''}
          onChange={(e) => updateConfig('message', e.target.value)}
          placeholder="输入提示文字，支持变量如：您的余额为 {user.余额} 元"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm h-20 resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          使用 {'{变量名}'} 插入变量值
        </p>
      </div>

      {/* 确认框特有配置 */}
      {config.promptType === 'confirm' && (
        <div className="border border-purple-600 rounded-lg p-4 space-y-4">
          <h4 className="text-sm font-medium text-purple-400">确认框配置</h4>
          
          {/* 按钮文字 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">确认按钮文字</label>
              <input
                type="text"
                value={config.confirmText || '确定'}
                onChange={(e) => updateConfig('confirmText', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">取消按钮文字</label>
              <input
                type="text"
                value={config.cancelText || '取消'}
                onChange={(e) => updateConfig('cancelText', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              />
            </div>
          </div>

          {/* 点击确认后 */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">点击确认后 → 跳转到</label>
            <select
              value={config.onConfirm || ''}
              onChange={(e) => updateConfig('onConfirm', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            >
              <option value="">-- 继续下一节点 --</option>
              {availableNodes.map(n => (
                <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
              ))}
            </select>
          </div>

          {/* 点击取消后 */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">点击取消后 → 跳转到</label>
            <select
              value={config.onCancel || ''}
              onChange={(e) => updateConfig('onCancel', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            >
              <option value="">-- 结束流程 --</option>
              {availableNodes.map(n => (
                <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 非确认框的后续行为 */}
      {config.promptType !== 'confirm' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">提示后行为</label>
          <div className="space-y-2">
            <label className="flex items-center text-sm text-gray-300">
              <input
                type="radio"
                checked={config.afterAction !== 'wait'}
                onChange={() => updateConfig('afterAction', 'continue')}
                className="mr-2"
              />
              继续下一节点（自动消失）
            </label>
            <label className="flex items-center text-sm text-gray-300">
              <input
                type="radio"
                checked={config.afterAction === 'wait'}
                onChange={() => updateConfig('afterAction', 'wait')}
                className="mr-2"
              />
              停留等待（用户点击后继续）
            </label>
          </div>
          
          {config.afterAction !== 'wait' && (
            <div className="mt-3">
              <label className="block text-xs text-gray-400 mb-1">显示时长（毫秒）</label>
              <input
                type="number"
                value={config.duration || 3000}
                onChange={(e) => updateConfig('duration', parseInt(e.target.value) || 3000)}
                min="1000"
                step="500"
                className="w-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              />
            </div>
          )}
        </div>
      )}

      {/* 预览 */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">效果预览</h4>
        <div className={`rounded-lg p-4 ${getTypeColor(config.promptType || 'info')}`}>
          <div className="flex items-start space-x-3">
            <span className="text-xl">
              {promptTypes.find(t => t.value === config.promptType)?.icon || 'ℹ'}
            </span>
            <div className="flex-1">
              <p className="text-white text-sm">
                {config.message || '提示内容'}
              </p>
              {config.promptType === 'confirm' && (
                <div className="flex space-x-2 mt-3">
                  <button className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-white text-sm">
                    {config.confirmText || '确定'}
                  </button>
                  <button className="px-3 py-1 bg-black/20 hover:bg-black/30 rounded text-white text-sm">
                    {config.cancelText || '取消'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.PromptConfigForm = PromptConfigForm;
