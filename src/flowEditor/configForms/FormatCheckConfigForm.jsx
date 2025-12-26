// 备注节点配置表单（原格式校验）
// 功能：添加流程备注说明
function FormatCheckConfigForm({ 
  node, 
  onUpdate
}) {
  const config = node.config || {};
  
  const updateConfig = (key, value) => {
    onUpdate({
      config: { ...config, [key]: value }
    });
  };

  return (
    <div className="space-y-4">
      {/* 说明 */}
      <div className="bg-gray-700/50 border border-gray-600 rounded p-3">
        <p className="text-sm text-gray-300">
          📝 备注节点：用于在流程中添加说明文字
        </p>
        <p className="text-xs text-gray-400 mt-1">
          备注不会影响流程执行，仅用于记录和说明
        </p>
      </div>

      {/* 备注内容 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          备注内容
        </label>
        <textarea
          value={config.note || ''}
          onChange={(e) => updateConfig('note', e.target.value)}
          placeholder="在此输入备注内容..."
          rows={6}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm resize-none"
        />
        <div className="mt-1 text-xs text-gray-500 text-right">
          {(config.note || '').length} 字
        </div>
      </div>

      {/* 提示 */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">💡 使用建议</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• 记录复杂逻辑的设计思路</li>
          <li>• 标注需要注意的业务规则</li>
          <li>• 添加变更历史说明</li>
          <li>• 标记待办事项或TODO</li>
        </ul>
      </div>
    </div>
  );
}

window.FormatCheckConfigForm = FormatCheckConfigForm;
