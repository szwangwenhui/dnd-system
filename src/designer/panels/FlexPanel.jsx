// Flex布局样式面板
// 包含：弹性容器设置、主轴/交叉轴对齐、换行、间距
function FlexPanel({ block, onUpdate }) {
  if (!block) return null;

  const style = block.style || {};

  // 更新样式
  const updateStyle = (key, value) => {
    onUpdate({
      style: { ...style, [key]: value }
    });
  };

  // 是否启用Flex
  const isFlexEnabled = style.display === 'flex';

  // 启用/禁用Flex
  const toggleFlex = () => {
    updateStyle('display', isFlexEnabled ? 'block' : 'flex');
  };

  return (
    <div className="space-y-4">
      {/* 启用Flex开关 */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
        <div>
          <span className="text-sm font-medium text-gray-700">启用Flex布局</span>
          <p className="text-xs text-gray-500">将区块设为弹性容器</p>
        </div>
        <button
          onClick={toggleFlex}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            isFlexEnabled ? 'bg-blue-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              isFlexEnabled ? 'left-7' : 'left-1'
            }`}
          />
        </button>
      </div>

      {/* Flex设置 - 仅启用时显示 */}
      {isFlexEnabled && (
        <>
          {/* 主轴方向 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">主轴方向 - flex-direction</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'row', label: '水平→', icon: '→' },
                { value: 'row-reverse', label: '水平←', icon: '←' },
                { value: 'column', label: '垂直↓', icon: '↓' },
                { value: 'column-reverse', label: '垂直↑', icon: '↑' },
              ].map(item => (
                <button
                  key={item.value}
                  onClick={() => updateStyle('flexDirection', item.value)}
                  className={`px-3 py-2 text-sm border rounded flex items-center justify-center space-x-1 ${
                    style.flexDirection === item.value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 主轴对齐 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">主轴对齐 - justify-content</label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { value: 'flex-start', label: '起点', icon: '⬛⬜⬜' },
                { value: 'center', label: '居中', icon: '⬜⬛⬜' },
                { value: 'flex-end', label: '终点', icon: '⬜⬜⬛' },
                { value: 'space-between', label: '两端', icon: '⬛⬜⬛' },
                { value: 'space-around', label: '环绕', icon: '·⬛·⬛·' },
                { value: 'space-evenly', label: '均分', icon: '|⬛|⬛|' },
              ].map(item => (
                <button
                  key={item.value}
                  onClick={() => updateStyle('justifyContent', item.value)}
                  className={`px-2 py-2 text-xs border rounded ${
                    style.justifyContent === item.value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-center">{item.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 交叉轴对齐 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">交叉轴对齐 - align-items</label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { value: 'flex-start', label: '顶部' },
                { value: 'center', label: '居中' },
                { value: 'flex-end', label: '底部' },
                { value: 'stretch', label: '拉伸' },
                { value: 'baseline', label: '基线' },
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

          {/* 换行 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">换行 - flex-wrap</label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { value: 'nowrap', label: '不换行' },
                { value: 'wrap', label: '换行' },
                { value: 'wrap-reverse', label: '反向换行' },
              ].map(item => (
                <button
                  key={item.value}
                  onClick={() => updateStyle('flexWrap', item.value)}
                  className={`px-2 py-2 text-xs border rounded ${
                    style.flexWrap === item.value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 多行对齐 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">多行对齐 - align-content</label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { value: 'flex-start', label: '顶部' },
                { value: 'center', label: '居中' },
                { value: 'flex-end', label: '底部' },
                { value: 'space-between', label: '两端' },
                { value: 'space-around', label: '环绕' },
                { value: 'stretch', label: '拉伸' },
              ].map(item => (
                <button
                  key={item.value}
                  onClick={() => updateStyle('alignContent', item.value)}
                  className={`px-2 py-2 text-xs border rounded ${
                    style.alignContent === item.value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">仅在换行时生效</p>
          </div>

          {/* 间距 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">间距 - gap</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs text-gray-500">行间距</span>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={style.rowGap || 0}
                    onChange={(e) => updateStyle('rowGap', parseInt(e.target.value) || 0)}
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
                    value={style.columnGap || 0}
                    onChange={(e) => updateStyle('columnGap', parseInt(e.target.value) || 0)}
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
                    updateStyle('rowGap', val);
                    updateStyle('columnGap', val);
                  }}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  {val}px
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
                  updateStyle('flexDirection', 'row');
                  updateStyle('justifyContent', 'center');
                  updateStyle('alignItems', 'center');
                }}
                className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                ⊕ 水平居中
              </button>
              <button
                onClick={() => {
                  updateStyle('flexDirection', 'column');
                  updateStyle('justifyContent', 'center');
                  updateStyle('alignItems', 'center');
                }}
                className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                ⊕ 垂直居中
              </button>
              <button
                onClick={() => {
                  updateStyle('flexDirection', 'row');
                  updateStyle('justifyContent', 'space-between');
                  updateStyle('alignItems', 'center');
                }}
                className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                ↔ 两端对齐
              </button>
              <button
                onClick={() => {
                  updateStyle('flexDirection', 'row');
                  updateStyle('justifyContent', 'flex-start');
                  updateStyle('alignItems', 'center');
                  updateStyle('flexWrap', 'wrap');
                  updateStyle('rowGap', 8);
                  updateStyle('columnGap', 8);
                }}
                className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                ⊞ 自动换行
              </button>
            </div>
          </div>

          {/* 重置Flex */}
          <button
            onClick={() => {
              updateStyle('flexDirection', 'row');
              updateStyle('justifyContent', 'flex-start');
              updateStyle('alignItems', 'stretch');
              updateStyle('flexWrap', 'nowrap');
              updateStyle('alignContent', 'stretch');
              updateStyle('rowGap', 0);
              updateStyle('columnGap', 0);
            }}
            className="w-full py-2 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            重置Flex设置
          </button>
        </>
      )}

      {/* 未启用时的提示 */}
      {!isFlexEnabled && (
        <div className="p-4 bg-gray-50 rounded text-center">
          <p className="text-sm text-gray-500">启用Flex布局后可设置子元素排列方式</p>
          <p className="text-xs text-gray-400 mt-1">适用于需要排列多个子区块的容器</p>
        </div>
      )}
    </div>
  );
}

window.FlexPanel = FlexPanel;
