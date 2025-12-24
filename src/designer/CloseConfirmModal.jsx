// DND2 页面设计器 - 关闭确认弹窗组件
// 原文件: src/designer/PageDesigner.jsx 第1680-1736行
// Phase 5 拆分: 文件 1/5

function CloseConfirmModal({ hasChanges, closeProgress, setCloseProgress, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-96 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">关闭设计页面</h3>
        {hasChanges && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
            ⚠️ 您有未保存的更改
          </div>
        )}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">请输入当前设计进度</label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={closeProgress}
              onChange={(e) => setCloseProgress(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              min="0"
              max="100"
              className="w-20 px-3 py-2 border border-gray-300 rounded"
            />
            <span className="text-gray-500">%</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div className="h-2 bg-blue-500 rounded-full" style={{ width: closeProgress + '%' }}></div>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
          >
            取消
          </button>
          {hasChanges && (
            <button
              onClick={() => onConfirm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              保存并关闭
            </button>
          )}
          <button
            onClick={() => onConfirm(false)}
            className={hasChanges 
              ? "px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              : "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            }
          >
            {hasChanges ? '不保存关闭' : '确认关闭'}
          </button>
        </div>
      </div>
    </div>
  );
}

window.CloseConfirmModal = CloseConfirmModal;

console.log('[DND2] designer/CloseConfirmModal.jsx 加载完成');
