// Grid布局样式面板
// 包含：网格容器设置、列/行定义、间距、对齐
function GridPanel({ block, onUpdate }) {
  if (!block) return null;

  const style = block.style || {};

  // 更新样式
  const updateStyle = (key, value) => {
    onUpdate({
      style: { ...style, [key]: value }
    });
  };

  // 是否启用Grid
  const isGridEnabled = style.display === 'grid';

  // 启用/禁用Grid
  const toggleGrid = () => {
    updateStyle('display', isGridEnabled ? 'block' : 'grid');
  };

  return (
    <div className="space-y-4">
      {/* 启用Grid开关 */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
        <div>
          <span className="text-sm font-medium text-gray-700">启用Grid布局</span>
          <p className="text-xs text-gray-500">将区块设为网格容器</p>
        </div>
        <button
          onClick={toggleGrid}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            isGridEnabled ? 'bg-blue-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              isGridEnabled ? 'left-7' : 'left-1'
            }`}
          />
        </button>
      </div>

      {/* Grid设置 - 仅启用时显示 */}
      {isGridEnabled && (
        <>
          {/* 列定义 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">列定义 - grid-template-columns</label>
            <input
              type="text"
              value={style.gridTemplateColumns || ''}
              onChange={(e) => updateStyle('gridTemplateColumns', e.target.value)}
              placeholder="如: 1fr 1fr 1fr 或 repeat(3, 1fr)"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono"
            />
            {/* 快捷列数 */}
            <div className="flex flex-wrap gap-1 mt-2">
              {[
                { label: '2列', value: 'repeat(2, 1fr)' },
                { label: '3列', value: 'repeat(3, 1fr)' },
                { label: '4列', value: 'repeat(4, 1fr)' },
                { label: '1:2', value: '1fr 2fr' },
                { label: '2:1', value: '2fr 1fr' },
                { label: '1:1:1', value: '1fr 1fr 1fr' },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => updateStyle('gridTemplateColumns', item.value)}
                  className={`px-2 py-1 text-xs border rounded ${
                    style.gridTemplateColumns === item.value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 行定义 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">行定义 - grid-template-rows</label>
            <input
              type="text"
              value={style.gridTemplateRows || ''}
              onChange={(e) => updateStyle('gridTemplateRows', e.target.value)}
              placeholder="如: auto 或 100px 200px"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono"
            />
            {/* 快捷行数 */}
            <div className="flex flex-wrap gap-1 mt-2">
              {[
                { label: '自动', value: 'auto' },
                { label: '2行', value: 'repeat(2, 1fr)' },
                { label: '3行', value: 'repeat(3, 1fr)' },
                { label: '头+体', value: 'auto 1fr' },
                { label: '头+体+尾', value: 'auto 1fr auto' },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => updateStyle('gridTemplateRows', item.value)}
                  className={`px-2 py-1 text-xs border rounded ${
                    style.gridTemplateRows === item.value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 间距 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">网格间距 - gap</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs text-gray-500">行间距</span>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={style.gridRowGap || 0}
                    onChange={(e) => updateStyle('gridRowGap', parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-xs text-gray-500">px</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500">列间距</span>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={style.gridColumnGap || 0}
                    onChange={(e) => updateStyle('gridColumnGap', parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-xs text-gray-500">px</span>
                </div>
              </div>
            </div>
            {/* 快捷间距 */}
            <div className="flex flex-wrap gap-1 mt-2">
              {[0, 4, 8, 12, 16, 24].map(val => (
                <button
                  key={val}
                  onClick={() => {
                    updateStyle('gridRowGap', val);
                    updateStyle('gridColumnGap', val);
                  }}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  {val}px
                </button>
              ))}
            </div>
          </div>

          {/* 水平对齐（项目） */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">水平对齐 - justify-items</label>
            <div className="grid grid-cols-4 gap-1">
              {[
                { value: 'start', label: '左' },
                { value: 'center', label: '中' },
                { value: 'end', label: '右' },
                { value: 'stretch', label: '拉伸' },
              ].map(item => (
                <button
                  key={item.value}
                  onClick={() => updateStyle('justifyItems', item.value)}
                  className={`px-2 py-2 text-xs border rounded ${
                    style.justifyItems === item.value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 垂直对齐（项目） */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">垂直对齐 - align-items</label>
            <div className="grid grid-cols-4 gap-1">
              {[
                { value: 'start', label: '上' },
                { value: 'center', label: '中' },
                { value: 'end', label: '下' },
                { value: 'stretch', label: '拉伸' },
              ].map(item => (
                <button
                  key={item.value}
                  onClick={() => updateStyle('alignItems', item.value)}
                  className={`px-2 py-2 text-xs border rounded ${
                    style.alignItems === item.value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 内容对齐（整体） */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">内容水平 - justify-content</label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { value: 'start', label: '左' },
                { value: 'center', label: '中' },
                { value: 'end', label: '右' },
                { value: 'space-between', label: '两端' },
                { value: 'space-around', label: '环绕' },
                { value: 'space-evenly', label: '均分' },
              ].map(item => (
                <button
                  key={item.value}
                  onClick={() => updateStyle('justifyContent', item.value)}
                  className={`px-2 py-1 text-xs border rounded ${
                    style.justifyContent === item.value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 布局预设 */}
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">布局预设</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  updateStyle('gridTemplateColumns', 'repeat(2, 1fr)');
                  updateStyle('gridTemplateRows', 'auto');
                  updateStyle('gridRowGap', 8);
                  updateStyle('gridColumnGap', 8);
                }}
                className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                ⊞ 2列等宽
              </button>
              <button
                onClick={() => {
                  updateStyle('gridTemplateColumns', 'repeat(3, 1fr)');
                  updateStyle('gridTemplateRows', 'auto');
                  updateStyle('gridRowGap', 8);
                  updateStyle('gridColumnGap', 8);
                }}
                className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                ⊞ 3列等宽
              </button>
              <button
                onClick={() => {
                  updateStyle('gridTemplateColumns', 'repeat(4, 1fr)');
                  updateStyle('gridTemplateRows', 'auto');
                  updateStyle('gridRowGap', 8);
                  updateStyle('gridColumnGap', 8);
                }}
                className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                ⊞ 4列等宽
              </button>
              <button
                onClick={() => {
                  updateStyle('gridTemplateColumns', '200px 1fr');
                  updateStyle('gridTemplateRows', 'auto');
                  updateStyle('gridRowGap', 0);
                  updateStyle('gridColumnGap', 16);
                }}
                className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                ◧ 侧边栏
              </button>
              <button
                onClick={() => {
                  updateStyle('gridTemplateColumns', '1fr');
                  updateStyle('gridTemplateRows', 'auto 1fr auto');
                  updateStyle('gridRowGap', 0);
                  updateStyle('gridColumnGap', 0);
                }}
                className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                ⊟ 头+体+尾
              </button>
              <button
                onClick={() => {
                  updateStyle('gridTemplateColumns', 'repeat(auto-fill, minmax(150px, 1fr))');
                  updateStyle('gridTemplateRows', 'auto');
                  updateStyle('gridRowGap', 12);
                  updateStyle('gridColumnGap', 12);
                }}
                className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                ⊞ 响应式卡片
              </button>
            </div>
          </div>

          {/* 重置Grid */}
          <button
            onClick={() => {
              updateStyle('gridTemplateColumns', '');
              updateStyle('gridTemplateRows', '');
              updateStyle('gridRowGap', 0);
              updateStyle('gridColumnGap', 0);
              updateStyle('justifyItems', 'stretch');
              updateStyle('alignItems', 'stretch');
              updateStyle('justifyContent', 'start');
            }}
            className="w-full py-2 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            重置Grid设置
          </button>
        </>
      )}

      {/* 未启用时的提示 */}
      {!isGridEnabled && (
        <div className="p-4 bg-gray-50 rounded text-center">
          <p className="text-sm text-gray-500">启用Grid布局后可设置网格排列</p>
          <p className="text-xs text-gray-400 mt-1">适用于复杂的二维布局场景</p>
        </div>
      )}
    </div>
  );
}

window.GridPanel = GridPanel;
