// 设计器工具栏组件
function DesignerToolbar({ 
  page, 
  canvasType, 
  setCanvasType,
  scale, 
  setScale, 
  canUndo, 
  canRedo, 
  onUndo, 
  onRedo, 
  onSave, 
  onClose,
  hasChanges,
  onOpenEditor,
  onOpenGraphicEditor,
  onOpenStylePanel,
  selectedBlockId
}) {
  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm flex-shrink-0">
      {/* 左侧：页面信息 */}
      <div className="flex items-center space-x-2">
        <span className="font-semibold text-gray-700">设计页面：</span>
        <span className="text-blue-600">{page.name}</span>
        <span className="text-gray-400 text-sm">({page.id})</span>
        {hasChanges && <span className="text-orange-500 text-sm">● 未保存</span>}
      </div>
      
      {/* 右侧：工具按钮 */}
      <div className="flex items-center space-x-3">
        {/* 设计样式按钮 */}
        <button
          onClick={onOpenStylePanel}
          className={`px-3 py-1.5 rounded flex items-center space-x-1 ${
            selectedBlockId 
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          title={selectedBlockId ? '打开样式面板' : '请先选中一个区块'}
          disabled={!selectedBlockId}
        >
          <span>🎨</span>
          <span>设计样式</span>
        </button>
        
        {/* 文档编辑器按钮 */}
        <button
          onClick={onOpenEditor}
          className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 flex items-center space-x-1"
          title="打开文档编辑器（富文本）"
        >
          <span>📄</span>
          <span>文档编辑器</span>
        </button>
        
        {/* 图形编辑器按钮 */}
        <button
          onClick={onOpenGraphicEditor}
          className="px-3 py-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center space-x-1"
          title="打开图形编辑器（绑图）"
        >
          <span>✏️</span>
          <span>图形编辑器</span>
        </button>
        
        <div className="w-px h-6 bg-gray-300"></div>
        
        {/* 画布类型选择 */}
        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setCanvasType('PC')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              canvasType === 'PC' 
                ? 'bg-white text-blue-600 shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            💻 PC端
          </button>
          <button
            onClick={() => setCanvasType('Mobile')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              canvasType === 'Mobile' 
                ? 'bg-white text-blue-600 shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📱 手机端
          </button>
        </div>
        
        <div className="w-px h-6 bg-gray-300"></div>
        
        {/* 撤销/重做 */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`px-3 py-1.5 rounded ${!canUndo ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
          title="撤销 (Ctrl+Z)"
        >
          ↶ 撤销
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`px-3 py-1.5 rounded ${!canRedo ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
          title="重做 (Ctrl+Y)"
        >
          ↷ 重做
        </button>
        
        <div className="w-px h-6 bg-gray-300"></div>
        
        {/* 缩放 */}
        <div className="flex items-center space-x-1">
          <span className="text-sm text-gray-500">缩放:</span>
          <select
            value={scale}
            onChange={(e) => setScale(parseInt(e.target.value))}
            className="px-2 py-1.5 border border-gray-300 rounded text-sm"
          >
            <option value="50">50%</option>
            <option value="75">75%</option>
            <option value="100">100%</option>
            <option value="125">125%</option>
            <option value="150">150%</option>
            <option value="200">200%</option>
          </select>
        </div>
        
        <div className="w-px h-6 bg-gray-300"></div>
        
        {/* 保存 */}
        <button
          onClick={onSave}
          className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          💾 保存
        </button>
        
        {/* 关闭 */}
        <button
          onClick={onClose}
          className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
        >
          关闭
        </button>
      </div>
    </div>
  );
}

window.DesignerToolbar = DesignerToolbar;
