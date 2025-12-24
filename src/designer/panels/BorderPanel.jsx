// 边框样式面板
// 包含：边框颜色、宽度、样式、圆角
function BorderPanel({ block, onUpdate }) {
  if (!block) return null;

  const style = block.style || {};

  // 更新样式
  const updateStyle = (key, value) => {
    onUpdate({
      style: { ...style, [key]: value }
    });
  };

  // 是否使用统一边框
  const [useUnifiedBorder, setUseUnifiedBorder] = React.useState(true);
  // 是否使用统一圆角
  const [useUnifiedRadius, setUseUnifiedRadius] = React.useState(true);

  return (
    <div className="space-y-3">
      {/* 边框设置模式切换 */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-600">边框设置</label>
        <label className="flex items-center text-xs text-gray-500">
          <input
            type="checkbox"
            checked={useUnifiedBorder}
            onChange={(e) => setUseUnifiedBorder(e.target.checked)}
            className="mr-1"
          />
          统一设置
        </label>
      </div>

      {useUnifiedBorder ? (
        /* 统一边框设置 */
        <div className="space-y-2">
          {/* 边框样式 */}
          <div>
            <span className="text-xs text-gray-500">样式</span>
            <select
              value={style.borderStyle || 'solid'}
              onChange={(e) => updateStyle('borderStyle', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="none">none (无)</option>
              <option value="solid">solid (实线)</option>
              <option value="dashed">dashed (虚线)</option>
              <option value="dotted">dotted (点线)</option>
              <option value="double">double (双线)</option>
              <option value="groove">groove (凹槽)</option>
              <option value="ridge">ridge (凸起)</option>
              <option value="inset">inset (内嵌)</option>
              <option value="outset">outset (外凸)</option>
            </select>
          </div>

          {/* 边框宽度 */}
          <div>
            <span className="text-xs text-gray-500">宽度 (px)</span>
            <input
              type="number"
              value={style.borderWidth || 1}
              min="0"
              max="20"
              onChange={(e) => updateStyle('borderWidth', parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>

          {/* 边框颜色 */}
          <div>
            <span className="text-xs text-gray-500">颜色</span>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={style.borderColor || '#cccccc'}
                onChange={(e) => updateStyle('borderColor', e.target.value)}
                className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={style.borderColor || '#cccccc'}
                onChange={(e) => updateStyle('borderColor', e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-mono"
              />
            </div>
          </div>
        </div>
      ) : (
        /* 四边分别设置 */
        <div className="space-y-2">
          {['Top', 'Right', 'Bottom', 'Left'].map(side => {
            const sideLower = side.toLowerCase();
            const widthKey = `border${side}Width`;
            const styleKey = `border${side}Style`;
            const colorKey = `border${side}Color`;
            
            return (
              <div key={side} className="p-2 bg-gray-50 rounded">
                <div className="text-xs font-medium text-gray-600 mb-1">
                  {side === 'Top' ? '上' : side === 'Right' ? '右' : side === 'Bottom' ? '下' : '左'}边框
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <select
                    value={style[styleKey] || 'solid'}
                    onChange={(e) => updateStyle(styleKey, e.target.value)}
                    className="px-1 py-1 border border-gray-300 rounded text-xs"
                  >
                    <option value="none">无</option>
                    <option value="solid">实线</option>
                    <option value="dashed">虚线</option>
                    <option value="dotted">点线</option>
                  </select>
                  <input
                    type="number"
                    value={style[widthKey] || 0}
                    min="0"
                    placeholder="宽度"
                    onChange={(e) => updateStyle(widthKey, parseInt(e.target.value) || 0)}
                    className="px-1 py-1 border border-gray-300 rounded text-xs"
                  />
                  <input
                    type="color"
                    value={style[colorKey] || '#cccccc'}
                    onChange={(e) => updateStyle(colorKey, e.target.value)}
                    className="w-full h-6 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 分隔线 */}
      <div className="border-t border-gray-200 pt-3">
        {/* 圆角设置模式切换 */}
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-600">圆角设置</label>
          <label className="flex items-center text-xs text-gray-500">
            <input
              type="checkbox"
              checked={useUnifiedRadius}
              onChange={(e) => setUseUnifiedRadius(e.target.checked)}
              className="mr-1"
            />
            统一设置
          </label>
        </div>

        {useUnifiedRadius ? (
          /* 统一圆角 */
          <div>
            <span className="text-xs text-gray-500">圆角 (px)</span>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={style.borderRadius || 0}
                min="0"
                onChange={(e) => updateStyle('borderRadius', parseInt(e.target.value) || 0)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <button
                onClick={() => updateStyle('borderRadius', '50%')}
                className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                title="设为圆形"
              >
                圆形
              </button>
            </div>
          </div>
        ) : (
          /* 四角分别设置 */
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'borderTopLeftRadius', label: '左上' },
              { key: 'borderTopRightRadius', label: '右上' },
              { key: 'borderBottomLeftRadius', label: '左下' },
              { key: 'borderBottomRightRadius', label: '右下' }
            ].map(corner => (
              <div key={corner.key}>
                <span className="text-xs text-gray-500">{corner.label}</span>
                <input
                  type="number"
                  value={style[corner.key] || 0}
                  min="0"
                  onChange={(e) => updateStyle(corner.key, parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 快捷预设 */}
      <div className="border-t border-gray-200 pt-3">
        <label className="block text-xs font-medium text-gray-600 mb-2">边框预设</label>
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => {
              updateStyle('borderWidth', 0);
              updateStyle('borderStyle', 'none');
            }}
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
          >
            无边框
          </button>
          <button
            onClick={() => {
              updateStyle('borderWidth', 1);
              updateStyle('borderStyle', 'solid');
              updateStyle('borderColor', '#e5e7eb');
            }}
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
          >
            细边框
          </button>
          <button
            onClick={() => {
              updateStyle('borderWidth', 2);
              updateStyle('borderStyle', 'solid');
              updateStyle('borderColor', '#3b82f6');
            }}
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
          >
            强调框
          </button>
          <button
            onClick={() => {
              updateStyle('borderRadius', 4);
            }}
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
          >
            小圆角
          </button>
          <button
            onClick={() => {
              updateStyle('borderRadius', 8);
            }}
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
          >
            中圆角
          </button>
          <button
            onClick={() => {
              updateStyle('borderRadius', 16);
            }}
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
          >
            大圆角
          </button>
        </div>
      </div>
    </div>
  );
}

window.BorderPanel = BorderPanel;
