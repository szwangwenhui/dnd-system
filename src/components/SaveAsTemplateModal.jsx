// 设为模板弹窗组件
// 功能：输入模板名称和描述，将页面或区块保存为模板

function SaveAsTemplateModal({ 
  type,        // 'page' | 'block'
  sourceName,  // 来源对象名称（用于显示）
  onSave,      // (name, description) => void
  onCancel     // () => void
}) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');

  const handleSave = () => {
    if (!name.trim()) {
      alert('请输入模板名称');
      return;
    }
    onSave(name.trim(), description.trim());
  };

  const typeLabel = type === 'page' ? '页面' : '区块';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* 标题栏 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            设为{typeLabel}模板
          </h3>
        </div>

        {/* 内容区 */}
        <div className="px-6 py-4 space-y-4">
          <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-700">
            <strong>来源{typeLabel}：</strong>{sourceName}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              模板名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`输入${typeLabel}模板名称`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              模板描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="可选，描述模板的用途和特点"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="text-sm text-gray-500">
            <p>💡 提示：</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>模板将保存{typeLabel}的所有样式和功能配置</li>
              <li>模板名称在项目内唯一</li>
              <li>创建后可在新建{typeLabel}时调用</li>
            </ul>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            保存为模板
          </button>
        </div>
      </div>
    </div>
  );
}

window.SaveAsTemplateModal = SaveAsTemplateModal;

console.log('[DND2] SaveAsTemplateModal.jsx 加载完成');
