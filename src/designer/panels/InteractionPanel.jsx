// 交互状态样式面板
// 包含：鼠标指针、悬浮状态、点击状态、禁用状态
function InteractionPanel({ block, onUpdate }) {
  if (!block) return null;

  const style = block.style || {};

  // 更新样式
  const updateStyle = (key, value) => {
    onUpdate({
      style: { ...style, [key]: value }
    });
  };

  // 鼠标指针选项
  const cursorOptions = [
    { value: 'default', label: '默认', icon: '↖' },
    { value: 'pointer', label: '手指', icon: '👆' },
    { value: 'move', label: '移动', icon: '✥' },
    { value: 'text', label: '文本', icon: 'I' },
    { value: 'crosshair', label: '十字', icon: '+' },
    { value: 'not-allowed', label: '禁止', icon: '🚫' },
    { value: 'grab', label: '抓取', icon: '✊' },
    { value: 'wait', label: '等待', icon: '⏳' },
    { value: 'help', label: '帮助', icon: '❓' },
    { value: 'zoom-in', label: '放大', icon: '🔍' },
    { value: 'zoom-out', label: '缩小', icon: '🔎' },
    { value: 'none', label: '隐藏', icon: '∅' },
  ];

  return (
    <div className="space-y-4">
      {/* ===== 鼠标指针 ===== */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">鼠标指针 - cursor</label>
        <div className="grid grid-cols-4 gap-1">
          {cursorOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => updateStyle('cursor', opt.value)}
              className={`px-2 py-2 text-xs border rounded flex flex-col items-center ${
                style.cursor === opt.value
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
              title={opt.label}
            >
              <span className="text-sm">{opt.icon}</span>
              <span className="text-[10px] mt-0.5">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== 悬浮状态 :hover ===== */}
      <div className="border-t border-gray-200 pt-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">悬浮状态 - :hover</label>
        <p className="text-xs text-gray-500 mb-2">鼠标悬停时的样式变化</p>
        
        <div className="space-y-3 p-3 bg-blue-50 rounded">
          {/* 背景色变化 */}
          <div>
            <span className="text-xs text-gray-600">背景颜色</span>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                value={style.hoverBackgroundColor || '#f3f4f6'}
                onChange={(e) => updateStyle('hoverBackgroundColor', e.target.value)}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={style.hoverBackgroundColor || ''}
                onChange={(e) => updateStyle('hoverBackgroundColor', e.target.value)}
                placeholder="悬浮背景色"
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
              />
              <button
                onClick={() => updateStyle('hoverBackgroundColor', '')}
                className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                清除
              </button>
            </div>
          </div>

          {/* 边框色变化 */}
          <div>
            <span className="text-xs text-gray-600">边框颜色</span>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                value={style.hoverBorderColor || '#3b82f6'}
                onChange={(e) => updateStyle('hoverBorderColor', e.target.value)}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={style.hoverBorderColor || ''}
                onChange={(e) => updateStyle('hoverBorderColor', e.target.value)}
                placeholder="悬浮边框色"
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
              />
              <button
                onClick={() => updateStyle('hoverBorderColor', '')}
                className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                清除
              </button>
            </div>
          </div>

          {/* 文字颜色变化 */}
          <div>
            <span className="text-xs text-gray-600">文字颜色</span>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                value={style.hoverColor || '#3b82f6'}
                onChange={(e) => updateStyle('hoverColor', e.target.value)}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={style.hoverColor || ''}
                onChange={(e) => updateStyle('hoverColor', e.target.value)}
                placeholder="悬浮文字色"
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
              />
              <button
                onClick={() => updateStyle('hoverColor', '')}
                className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                清除
              </button>
            </div>
          </div>

          {/* 透明度变化 */}
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>透明度</span>
              <span>{style.hoverOpacity !== undefined ? style.hoverOpacity : 1}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={style.hoverOpacity !== undefined ? style.hoverOpacity : 1}
              onChange={(e) => updateStyle('hoverOpacity', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* 缩放变化 */}
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>缩放</span>
              <span>{style.hoverScale || 1}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.02"
              value={style.hoverScale || 1}
              onChange={(e) => updateStyle('hoverScale', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* 阴影变化 */}
          <div>
            <span className="text-xs text-gray-600">悬浮阴影</span>
            <select
              value={style.hoverBoxShadow || 'none'}
              onChange={(e) => updateStyle('hoverBoxShadow', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs mt-1"
            >
              <option value="none">无</option>
              <option value="0 2px 4px rgba(0,0,0,0.1)">轻柔</option>
              <option value="0 4px 8px rgba(0,0,0,0.15)">标准</option>
              <option value="0 8px 16px rgba(0,0,0,0.2)">悬浮</option>
              <option value="0 12px 24px rgba(0,0,0,0.25)">深邃</option>
            </select>
          </div>
        </div>

        {/* 悬浮预设 */}
        <div className="flex flex-wrap gap-1 mt-2">
          {[
            { label: '无效果', hover: {} },
            { label: '变亮', hover: { hoverBackgroundColor: '#f9fafb', hoverOpacity: 1 } },
            { label: '变暗', hover: { hoverOpacity: 0.8 } },
            { label: '放大', hover: { hoverScale: 1.05 } },
            { label: '抬起', hover: { hoverBoxShadow: '0 8px 16px rgba(0,0,0,0.2)', hoverScale: 1.02 } },
            { label: '高亮边框', hover: { hoverBorderColor: '#3b82f6' } },
          ].map(preset => (
            <button
              key={preset.label}
              onClick={() => {
                // 清除所有悬浮样式
                updateStyle('hoverBackgroundColor', '');
                updateStyle('hoverBorderColor', '');
                updateStyle('hoverColor', '');
                updateStyle('hoverOpacity', 1);
                updateStyle('hoverScale', 1);
                updateStyle('hoverBoxShadow', 'none');
                // 应用预设
                Object.entries(preset.hover).forEach(([key, value]) => {
                  updateStyle(key, value);
                });
              }}
              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== 点击状态 :active ===== */}
      <div className="border-t border-gray-200 pt-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">点击状态 - :active</label>
        <p className="text-xs text-gray-500 mb-2">鼠标按下时的样式变化</p>
        
        <div className="space-y-3 p-3 bg-green-50 rounded">
          {/* 背景色 */}
          <div>
            <span className="text-xs text-gray-600">背景颜色</span>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                value={style.activeBackgroundColor || '#e5e7eb'}
                onChange={(e) => updateStyle('activeBackgroundColor', e.target.value)}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={style.activeBackgroundColor || ''}
                onChange={(e) => updateStyle('activeBackgroundColor', e.target.value)}
                placeholder="点击背景色"
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
              />
            </div>
          </div>

          {/* 缩放 */}
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>缩放</span>
              <span>{style.activeScale || 1}x</span>
            </div>
            <input
              type="range"
              min="0.9"
              max="1.1"
              step="0.01"
              value={style.activeScale || 1}
              onChange={(e) => updateStyle('activeScale', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* 点击预设 */}
        <div className="flex flex-wrap gap-1 mt-2">
          {[
            { label: '无效果', active: { activeBackgroundColor: '', activeScale: 1 } },
            { label: '按下', active: { activeScale: 0.95 } },
            { label: '深按', active: { activeScale: 0.9, activeBackgroundColor: '#e5e7eb' } },
          ].map(preset => (
            <button
              key={preset.label}
              onClick={() => {
                Object.entries(preset.active).forEach(([key, value]) => {
                  updateStyle(key, value);
                });
              }}
              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== 禁用状态 ===== */}
      <div className="border-t border-gray-200 pt-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">禁用状态</label>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
          <div>
            <span className="text-sm text-gray-700">禁用交互</span>
            <p className="text-xs text-gray-500">禁止鼠标事件</p>
          </div>
          <button
            onClick={() => updateStyle('pointerEvents', style.pointerEvents === 'none' ? 'auto' : 'none')}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              style.pointerEvents === 'none' ? 'bg-red-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                style.pointerEvents === 'none' ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>

        {style.pointerEvents === 'none' && (
          <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600">
            ⚠️ 区块已禁用，无法响应鼠标事件
          </div>
        )}
      </div>

      {/* ===== 用户选择 ===== */}
      <div className="border-t border-gray-200 pt-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">文字选择 - user-select</label>
        <div className="grid grid-cols-4 gap-1">
          {[
            { value: 'auto', label: '自动' },
            { value: 'text', label: '可选' },
            { value: 'none', label: '禁选' },
            { value: 'all', label: '全选' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => updateStyle('userSelect', opt.value)}
              className={`px-2 py-2 text-xs border rounded ${
                style.userSelect === opt.value
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 重置交互 */}
      <button
        onClick={() => {
          updateStyle('cursor', 'default');
          updateStyle('hoverBackgroundColor', '');
          updateStyle('hoverBorderColor', '');
          updateStyle('hoverColor', '');
          updateStyle('hoverOpacity', 1);
          updateStyle('hoverScale', 1);
          updateStyle('hoverBoxShadow', 'none');
          updateStyle('activeBackgroundColor', '');
          updateStyle('activeScale', 1);
          updateStyle('pointerEvents', 'auto');
          updateStyle('userSelect', 'auto');
        }}
        className="w-full py-2 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
      >
        重置所有交互样式
      </button>
    </div>
  );
}

window.InteractionPanel = InteractionPanel;
