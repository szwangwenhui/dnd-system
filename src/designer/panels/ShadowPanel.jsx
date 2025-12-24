// 阴影样式面板
// 包含：盒阴影、文字阴影、滤镜效果
function ShadowPanel({ block, onUpdate }) {
  if (!block) return null;

  const style = block.style || {};

  // 更新样式
  const updateStyle = (key, value) => {
    onUpdate({
      style: { ...style, [key]: value }
    });
  };

  // 盒阴影状态
  const [boxShadow, setBoxShadow] = React.useState({
    offsetX: style.boxShadowOffsetX || 0,
    offsetY: style.boxShadowOffsetY || 4,
    blur: style.boxShadowBlur || 8,
    spread: style.boxShadowSpread || 0,
    color: style.boxShadowColor || 'rgba(0,0,0,0.2)',
    inset: style.boxShadowInset || false
  });

  // 文字阴影状态
  const [textShadow, setTextShadow] = React.useState({
    offsetX: style.textShadowOffsetX || 0,
    offsetY: style.textShadowOffsetY || 2,
    blur: style.textShadowBlur || 4,
    color: style.textShadowColor || 'rgba(0,0,0,0.3)'
  });

  // 生成盒阴影CSS
  const generateBoxShadow = (shadow) => {
    const { offsetX, offsetY, blur, spread, color, inset } = shadow;
    const insetStr = inset ? 'inset ' : '';
    return `${insetStr}${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color}`;
  };

  // 生成文字阴影CSS
  const generateTextShadow = (shadow) => {
    const { offsetX, offsetY, blur, color } = shadow;
    return `${offsetX}px ${offsetY}px ${blur}px ${color}`;
  };

  // 应用盒阴影
  const applyBoxShadow = () => {
    const shadowCSS = generateBoxShadow(boxShadow);
    updateStyle('boxShadow', shadowCSS);
    // 保存各个参数以便编辑
    updateStyle('boxShadowOffsetX', boxShadow.offsetX);
    updateStyle('boxShadowOffsetY', boxShadow.offsetY);
    updateStyle('boxShadowBlur', boxShadow.blur);
    updateStyle('boxShadowSpread', boxShadow.spread);
    updateStyle('boxShadowColor', boxShadow.color);
    updateStyle('boxShadowInset', boxShadow.inset);
  };

  // 应用文字阴影
  const applyTextShadow = () => {
    const shadowCSS = generateTextShadow(textShadow);
    updateStyle('textShadow', shadowCSS);
    updateStyle('textShadowOffsetX', textShadow.offsetX);
    updateStyle('textShadowOffsetY', textShadow.offsetY);
    updateStyle('textShadowBlur', textShadow.blur);
    updateStyle('textShadowColor', textShadow.color);
  };

  // 清除盒阴影
  const clearBoxShadow = () => {
    updateStyle('boxShadow', 'none');
  };

  // 清除文字阴影
  const clearTextShadow = () => {
    updateStyle('textShadow', 'none');
  };

  // 盒阴影预设
  const boxShadowPresets = [
    { name: '无', value: { offsetX: 0, offsetY: 0, blur: 0, spread: 0, color: 'rgba(0,0,0,0)', inset: false } },
    { name: '轻柔', value: { offsetX: 0, offsetY: 2, blur: 4, spread: 0, color: 'rgba(0,0,0,0.1)', inset: false } },
    { name: '标准', value: { offsetX: 0, offsetY: 4, blur: 8, spread: 0, color: 'rgba(0,0,0,0.15)', inset: false } },
    { name: '悬浮', value: { offsetX: 0, offsetY: 8, blur: 16, spread: 0, color: 'rgba(0,0,0,0.2)', inset: false } },
    { name: '深邃', value: { offsetX: 0, offsetY: 12, blur: 24, spread: -4, color: 'rgba(0,0,0,0.25)', inset: false } },
    { name: '内凹', value: { offsetX: 0, offsetY: 2, blur: 4, spread: 0, color: 'rgba(0,0,0,0.2)', inset: true } },
  ];

  return (
    <div className="space-y-4">
      {/* ===== 盒阴影 ===== */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">盒阴影 - box-shadow</label>
        
        {/* 预设选择 */}
        <div className="mb-3">
          <span className="text-xs text-gray-500">快速预设：</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {boxShadowPresets.map(preset => (
              <button
                key={preset.name}
                onClick={() => {
                  setBoxShadow(preset.value);
                  // 立即应用
                  const shadowCSS = generateBoxShadow(preset.value);
                  updateStyle('boxShadow', shadowCSS);
                }}
                className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* 阴影参数 */}
        <div className="space-y-2 p-3 bg-gray-50 rounded">
          {/* X/Y偏移 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-gray-500">X偏移 (px)</span>
              <input
                type="number"
                value={boxShadow.offsetX}
                onChange={(e) => setBoxShadow(prev => ({ ...prev, offsetX: parseInt(e.target.value) || 0 }))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <span className="text-xs text-gray-500">Y偏移 (px)</span>
              <input
                type="number"
                value={boxShadow.offsetY}
                onChange={(e) => setBoxShadow(prev => ({ ...prev, offsetY: parseInt(e.target.value) || 0 }))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          {/* 模糊/扩散 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-gray-500">模糊 (px)</span>
              <input
                type="number"
                value={boxShadow.blur}
                min="0"
                onChange={(e) => setBoxShadow(prev => ({ ...prev, blur: Math.max(0, parseInt(e.target.value) || 0) }))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <span className="text-xs text-gray-500">扩散 (px)</span>
              <input
                type="number"
                value={boxShadow.spread}
                onChange={(e) => setBoxShadow(prev => ({ ...prev, spread: parseInt(e.target.value) || 0 }))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          {/* 颜色 */}
          <div>
            <span className="text-xs text-gray-500">阴影颜色</span>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={boxShadow.color.startsWith('rgba') ? '#000000' : boxShadow.color}
                onChange={(e) => setBoxShadow(prev => ({ ...prev, color: e.target.value }))}
                className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={boxShadow.color}
                onChange={(e) => setBoxShadow(prev => ({ ...prev, color: e.target.value }))}
                placeholder="rgba(0,0,0,0.2)"
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono"
              />
            </div>
          </div>

          {/* 内阴影 */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={boxShadow.inset}
              onChange={(e) => setBoxShadow(prev => ({ ...prev, inset: e.target.checked }))}
              className="rounded"
            />
            <span className="text-xs text-gray-600">内阴影 (inset)</span>
          </label>

          {/* 预览和应用 */}
          <div className="flex items-center space-x-2 pt-2">
            <div
              className="flex-1 h-8 bg-white rounded border border-gray-200"
              style={{ boxShadow: generateBoxShadow(boxShadow) }}
            ></div>
            <button
              onClick={applyBoxShadow}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              应用
            </button>
            <button
              onClick={clearBoxShadow}
              className="px-3 py-1 border border-gray-300 text-xs rounded hover:bg-gray-50"
            >
              清除
            </button>
          </div>
        </div>
      </div>

      {/* ===== 文字阴影 ===== */}
      <div className="border-t border-gray-200 pt-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">文字阴影 - text-shadow</label>
        
        <div className="space-y-2 p-3 bg-gray-50 rounded">
          {/* X/Y偏移 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-gray-500">X偏移 (px)</span>
              <input
                type="number"
                value={textShadow.offsetX}
                onChange={(e) => setTextShadow(prev => ({ ...prev, offsetX: parseInt(e.target.value) || 0 }))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <span className="text-xs text-gray-500">Y偏移 (px)</span>
              <input
                type="number"
                value={textShadow.offsetY}
                onChange={(e) => setTextShadow(prev => ({ ...prev, offsetY: parseInt(e.target.value) || 0 }))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          {/* 模糊 */}
          <div>
            <span className="text-xs text-gray-500">模糊 (px)</span>
            <input
              type="number"
              value={textShadow.blur}
              min="0"
              onChange={(e) => setTextShadow(prev => ({ ...prev, blur: Math.max(0, parseInt(e.target.value) || 0) }))}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>

          {/* 颜色 */}
          <div>
            <span className="text-xs text-gray-500">阴影颜色</span>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={textShadow.color.startsWith('rgba') ? '#000000' : textShadow.color}
                onChange={(e) => setTextShadow(prev => ({ ...prev, color: e.target.value }))}
                className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={textShadow.color}
                onChange={(e) => setTextShadow(prev => ({ ...prev, color: e.target.value }))}
                placeholder="rgba(0,0,0,0.3)"
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono"
              />
            </div>
          </div>

          {/* 预览和应用 */}
          <div className="flex items-center space-x-2 pt-2">
            <div
              className="flex-1 text-center py-1 bg-white rounded border border-gray-200 text-sm font-medium"
              style={{ textShadow: generateTextShadow(textShadow) }}
            >
              文字阴影预览
            </div>
            <button
              onClick={applyTextShadow}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              应用
            </button>
            <button
              onClick={clearTextShadow}
              className="px-3 py-1 border border-gray-300 text-xs rounded hover:bg-gray-50"
            >
              清除
            </button>
          </div>
        </div>
      </div>

      {/* ===== 滤镜效果 ===== */}
      <div className="border-t border-gray-200 pt-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">滤镜效果 - filter</label>
        
        <div className="space-y-3">
          {/* 模糊 */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>模糊 (blur)</span>
              <span>{style.filterBlur || 0}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={style.filterBlur || 0}
              onChange={(e) => updateStyle('filterBlur', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* 亮度 */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>亮度 (brightness)</span>
              <span>{style.filterBrightness || 100}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={style.filterBrightness || 100}
              onChange={(e) => updateStyle('filterBrightness', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* 对比度 */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>对比度 (contrast)</span>
              <span>{style.filterContrast || 100}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={style.filterContrast || 100}
              onChange={(e) => updateStyle('filterContrast', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* 饱和度 */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>饱和度 (saturate)</span>
              <span>{style.filterSaturate || 100}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={style.filterSaturate || 100}
              onChange={(e) => updateStyle('filterSaturate', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* 灰度 */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>灰度 (grayscale)</span>
              <span>{style.filterGrayscale || 0}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={style.filterGrayscale || 0}
              onChange={(e) => updateStyle('filterGrayscale', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* 透明度 */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>透明度 (opacity)</span>
              <span>{style.filterOpacity || 100}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={style.filterOpacity || 100}
              onChange={(e) => updateStyle('filterOpacity', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* 重置滤镜 */}
          <button
            onClick={() => {
              updateStyle('filterBlur', 0);
              updateStyle('filterBrightness', 100);
              updateStyle('filterContrast', 100);
              updateStyle('filterSaturate', 100);
              updateStyle('filterGrayscale', 0);
              updateStyle('filterOpacity', 100);
            }}
            className="w-full py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            重置所有滤镜
          </button>
        </div>
      </div>
    </div>
  );
}

window.ShadowPanel = ShadowPanel;
