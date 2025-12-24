// 过渡动画样式面板
// 包含：过渡效果、动画、变形
function TransitionPanel({ block, onUpdate }) {
  if (!block) return null;

  const style = block.style || {};

  // 更新样式
  const updateStyle = (key, value) => {
    onUpdate({
      style: { ...style, [key]: value }
    });
  };

  // 缓动函数选项
  const easingOptions = [
    { value: 'linear', label: '线性' },
    { value: 'ease', label: '平滑' },
    { value: 'ease-in', label: '渐入' },
    { value: 'ease-out', label: '渐出' },
    { value: 'ease-in-out', label: '渐入渐出' },
  ];

  // 过渡属性选项
  const transitionProperties = [
    { value: 'all', label: '全部' },
    { value: 'opacity', label: '透明度' },
    { value: 'transform', label: '变形' },
    { value: 'background', label: '背景' },
    { value: 'color', label: '颜色' },
    { value: 'border', label: '边框' },
    { value: 'box-shadow', label: '阴影' },
    { value: 'width', label: '宽度' },
    { value: 'height', label: '高度' },
  ];

  return (
    <div className="space-y-4">
      {/* ===== 过渡效果 ===== */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">过渡效果 - transition</label>
        
        <div className="space-y-3 p-3 bg-gray-50 rounded">
          {/* 过渡属性 */}
          <div>
            <span className="text-xs text-gray-500">过渡属性</span>
            <select
              value={style.transitionProperty || 'all'}
              onChange={(e) => updateStyle('transitionProperty', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
            >
              {transitionProperties.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* 持续时间 */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>持续时间</span>
              <span>{style.transitionDuration || 300}ms</span>
            </div>
            <input
              type="range"
              min="0"
              max="2000"
              step="50"
              value={style.transitionDuration || 300}
              onChange={(e) => updateStyle('transitionDuration', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>0</span>
              <span>2000ms</span>
            </div>
          </div>

          {/* 缓动函数 */}
          <div>
            <span className="text-xs text-gray-500">缓动函数</span>
            <div className="grid grid-cols-3 gap-1 mt-1">
              {easingOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateStyle('transitionTimingFunction', opt.value)}
                  className={`px-2 py-1 text-xs border rounded ${
                    style.transitionTimingFunction === opt.value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 延迟 */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>延迟时间</span>
              <span>{style.transitionDelay || 0}ms</span>
            </div>
            <input
              type="range"
              min="0"
              max="1000"
              step="50"
              value={style.transitionDelay || 0}
              onChange={(e) => updateStyle('transitionDelay', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* 过渡预设 */}
        <div className="flex flex-wrap gap-1 mt-2">
          {[
            { label: '无', duration: 0, timing: 'linear' },
            { label: '快速', duration: 150, timing: 'ease' },
            { label: '标准', duration: 300, timing: 'ease' },
            { label: '平滑', duration: 500, timing: 'ease-in-out' },
            { label: '缓慢', duration: 800, timing: 'ease-out' },
          ].map(preset => (
            <button
              key={preset.label}
              onClick={() => {
                updateStyle('transitionDuration', preset.duration);
                updateStyle('transitionTimingFunction', preset.timing);
                updateStyle('transitionProperty', 'all');
                updateStyle('transitionDelay', 0);
              }}
              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== 变形 Transform ===== */}
      <div className="border-t border-gray-200 pt-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">变形 - transform</label>
        
        <div className="space-y-3">
          {/* 平移 */}
          <div className="p-3 bg-gray-50 rounded">
            <span className="text-xs text-gray-600 font-medium">平移 (translate)</span>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <span className="text-xs text-gray-500">X轴 (px)</span>
                <input
                  type="number"
                  value={style.translateX || 0}
                  onChange={(e) => updateStyle('translateX', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <span className="text-xs text-gray-500">Y轴 (px)</span>
                <input
                  type="number"
                  value={style.translateY || 0}
                  onChange={(e) => updateStyle('translateY', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          </div>

          {/* 缩放 */}
          <div className="p-3 bg-gray-50 rounded">
            <span className="text-xs text-gray-600 font-medium">缩放 (scale)</span>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <span className="text-xs text-gray-500">X轴</span>
                <input
                  type="number"
                  step="0.1"
                  value={style.scaleX || 1}
                  onChange={(e) => updateStyle('scaleX', parseFloat(e.target.value) || 1)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <span className="text-xs text-gray-500">Y轴</span>
                <input
                  type="number"
                  step="0.1"
                  value={style.scaleY || 1}
                  onChange={(e) => updateStyle('scaleY', parseFloat(e.target.value) || 1)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
            {/* 快捷缩放 */}
            <div className="flex flex-wrap gap-1 mt-2">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(val => (
                <button
                  key={val}
                  onClick={() => {
                    updateStyle('scaleX', val);
                    updateStyle('scaleY', val);
                  }}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  {val}x
                </button>
              ))}
            </div>
          </div>

          {/* 旋转 */}
          <div className="p-3 bg-gray-50 rounded">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 font-medium">旋转 (rotate)</span>
              <span className="text-xs text-gray-500">{style.rotate || 0}°</span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              value={style.rotate || 0}
              onChange={(e) => updateStyle('rotate', parseInt(e.target.value))}
              className="w-full mt-2"
            />
            {/* 快捷旋转 */}
            <div className="flex flex-wrap gap-1 mt-2">
              {[-90, -45, 0, 45, 90, 180].map(val => (
                <button
                  key={val}
                  onClick={() => updateStyle('rotate', val)}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  {val}°
                </button>
              ))}
            </div>
          </div>

          {/* 倾斜 */}
          <div className="p-3 bg-gray-50 rounded">
            <span className="text-xs text-gray-600 font-medium">倾斜 (skew)</span>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <span className="text-xs text-gray-500">X轴 (°)</span>
                <input
                  type="number"
                  value={style.skewX || 0}
                  onChange={(e) => updateStyle('skewX', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <span className="text-xs text-gray-500">Y轴 (°)</span>
                <input
                  type="number"
                  value={style.skewY || 0}
                  onChange={(e) => updateStyle('skewY', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          </div>

          {/* 变形原点 */}
          <div>
            <span className="text-xs text-gray-500">变形原点</span>
            <div className="grid grid-cols-3 gap-1 mt-1">
              {[
                { value: 'top left', label: '↖' },
                { value: 'top center', label: '↑' },
                { value: 'top right', label: '↗' },
                { value: 'center left', label: '←' },
                { value: 'center center', label: '⊙' },
                { value: 'center right', label: '→' },
                { value: 'bottom left', label: '↙' },
                { value: 'bottom center', label: '↓' },
                { value: 'bottom right', label: '↘' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateStyle('transformOrigin', opt.value)}
                  className={`px-2 py-2 text-sm border rounded ${
                    style.transformOrigin === opt.value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 重置按钮 */}
      <div className="flex space-x-2 pt-2">
        <button
          onClick={() => {
            updateStyle('transitionProperty', 'all');
            updateStyle('transitionDuration', 0);
            updateStyle('transitionTimingFunction', 'linear');
            updateStyle('transitionDelay', 0);
          }}
          className="flex-1 py-2 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
        >
          重置过渡
        </button>
        <button
          onClick={() => {
            updateStyle('translateX', 0);
            updateStyle('translateY', 0);
            updateStyle('scaleX', 1);
            updateStyle('scaleY', 1);
            updateStyle('rotate', 0);
            updateStyle('skewX', 0);
            updateStyle('skewY', 0);
            updateStyle('transformOrigin', 'center center');
          }}
          className="flex-1 py-2 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
        >
          重置变形
        </button>
      </div>
    </div>
  );
}

window.TransitionPanel = TransitionPanel;
