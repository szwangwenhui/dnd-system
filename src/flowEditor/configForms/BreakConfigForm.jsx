// 跳出循环节点配置表单
function BreakConfigForm({ node, nodes, onUpdate }) {
  const config = node.config || {};
  
  // 找出所有循环节点
  const loopNodes = nodes.filter(n => n.type === 'loop');
  
  const updateConfig = (key, value) => {
    onUpdate({
      config: { ...config, [key]: value }
    });
  };

  return (
    <div className="space-y-4">
      {/* 说明 */}
      <div className="bg-purple-900/30 border border-purple-700 rounded p-3">
        <p className="text-sm text-purple-300">
          ⏹ 跳出循环节点用于在循环体内提前终止循环，跳转到循环结束后的节点继续执行。
        </p>
      </div>

      {/* 关联的循环节点 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          关联的循环节点
        </label>
        {loopNodes.length > 0 ? (
          <select
            value={config.targetLoop || ''}
            onChange={(e) => updateConfig('targetLoop', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          >
            <option value="">-- 自动检测最近的循环 --</option>
            {loopNodes.map(n => (
              <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
            ))}
          </select>
        ) : (
          <div className="text-sm text-yellow-400 bg-yellow-900/30 border border-yellow-700 rounded p-3">
            ⚠ 当前流程中没有循环节点，请先添加循环节点
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          如果有嵌套循环，可以指定要跳出哪个循环
        </p>
      </div>

      {/* 跳出条件（可选） */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          跳出条件（可选）
        </label>
        <input
          type="text"
          value={config.breakCondition || ''}
          onChange={(e) => updateConfig('breakCondition', e.target.value)}
          placeholder="留空表示无条件跳出，或输入条件如：found == true"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          💡 通常在是非分叉后使用，此处条件可留空
        </p>
      </div>

      {/* 使用场景 */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">常见使用场景</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• 在循环中找到目标数据后立即跳出</li>
          <li>• 遇到错误时提前终止循环</li>
          <li>• 满足特定条件时不再继续遍历</li>
        </ul>
      </div>

      {/* 预览 */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">流程示意</h4>
        <div className="bg-gray-900 rounded p-3 text-xs font-mono">
          <div className="text-purple-400">↺ 循环 {config.targetLoop || '...'}</div>
          <div className="text-gray-500 pl-4">│</div>
          <div className="text-gray-500 pl-4">├─ 处理数据...</div>
          <div className="text-gray-500 pl-4">│</div>
          <div className="text-yellow-400 pl-4">├─ ◇ 是否找到?</div>
          <div className="text-green-400 pl-8">│ 是 → ⏹ 跳出循环</div>
          <div className="text-red-400 pl-8">│ 否 → 继续下一次</div>
          <div className="text-gray-500 pl-4">│</div>
          <div className="text-purple-400">↺ 循环结束</div>
          <div className="text-gray-500 pl-4">↓</div>
          <div className="text-gray-400 pl-4">继续后续流程...</div>
        </div>
      </div>
    </div>
  );
}

window.BreakConfigForm = BreakConfigForm;
