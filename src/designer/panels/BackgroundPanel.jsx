// 背景样式面板
// 包含：背景颜色、背景图片、渐变、背景尺寸等
function BackgroundPanel({ block, onUpdate }) {
  if (!block) return null;

  const style = block.style || {};

  // 更新样式
  const updateStyle = (key, value) => {
    onUpdate({
      style: { ...style, [key]: value }
    });
  };

  // 渐变类型
  const [gradientType, setGradientType] = React.useState('none');
  const [gradientColor1, setGradientColor1] = React.useState('#ffffff');
  const [gradientColor2, setGradientColor2] = React.useState('#000000');
  const [gradientAngle, setGradientAngle] = React.useState(180);

  // 生成渐变CSS
  const generateGradient = () => {
    if (gradientType === 'linear') {
      return `linear-gradient(${gradientAngle}deg, ${gradientColor1}, ${gradientColor2})`;
    } else if (gradientType === 'radial') {
      return `radial-gradient(circle, ${gradientColor1}, ${gradientColor2})`;
    }
    return '';
  };

  // 应用渐变
  const applyGradient = () => {
    const gradient = generateGradient();
    if (gradient) {
      updateStyle('backgroundImage', gradient);
    }
  };

  return (
    <div className="space-y-3">
      {/* 背景颜色 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">背景颜色 - background-color</label>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={style.backgroundColor || '#ffffff'}
            onChange={(e) => updateStyle('backgroundColor', e.target.value)}
            className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
          />
          <input
            type="text"
            value={style.backgroundColor || '#ffffff'}
            onChange={(e) => updateStyle('backgroundColor', e.target.value)}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-mono"
          />
          <button
            onClick={() => updateStyle('backgroundColor', 'transparent')}
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
            title="设为透明"
          >
            透明
          </button>
        </div>
      </div>

      {/* 透明度 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          透明度 - opacity: {style.opacity !== undefined ? style.opacity : 1}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={style.opacity !== undefined ? style.opacity : 1}
          onChange={(e) => updateStyle('opacity', parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {/* 渐变设置 */}
      <div className="border-t border-gray-200 pt-3">
        <label className="block text-xs font-medium text-gray-600 mb-2">渐变背景</label>
        
        {/* 渐变类型 */}
        <div className="mb-2">
          <select
            value={gradientType}
            onChange={(e) => setGradientType(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="none">无渐变</option>
            <option value="linear">线性渐变</option>
            <option value="radial">径向渐变</option>
          </select>
        </div>

        {/* 渐变颜色 */}
        {gradientType !== 'none' && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 w-12">颜色1:</span>
              <input
                type="color"
                value={gradientColor1}
                onChange={(e) => setGradientColor1(e.target.value)}
                className="w-8 h-6 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={gradientColor1}
                onChange={(e) => setGradientColor1(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 w-12">颜色2:</span>
              <input
                type="color"
                value={gradientColor2}
                onChange={(e) => setGradientColor2(e.target.value)}
                className="w-8 h-6 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={gradientColor2}
                onChange={(e) => setGradientColor2(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono"
              />
            </div>
            
            {/* 线性渐变角度 */}
            {gradientType === 'linear' && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 w-12">角度:</span>
                <input
                  type="number"
                  value={gradientAngle}
                  min="0"
                  max="360"
                  onChange={(e) => setGradientAngle(parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <span className="text-xs text-gray-400">度</span>
              </div>
            )}

            {/* 渐变预览和应用 */}
            <div className="flex items-center space-x-2">
              <div
                className="w-full h-6 rounded border border-gray-300"
                style={{ background: generateGradient() }}
              ></div>
              <button
                onClick={applyGradient}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                应用
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 背景图片URL */}
      <div className="border-t border-gray-200 pt-3">
        <label className="block text-xs font-medium text-gray-600 mb-1">背景图片 - background-image</label>
        <input
          type="text"
          value={style.backgroundImageUrl || ''}
          onChange={(e) => {
            const url = e.target.value;
            updateStyle('backgroundImageUrl', url);
            if (url) {
              updateStyle('backgroundImage', `url(${url})`);
            } else {
              updateStyle('backgroundImage', '');
            }
          }}
          placeholder="输入图片URL"
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        />
      </div>

      {/* 背景尺寸 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">背景尺寸 - background-size</label>
        <select
          value={style.backgroundSize || 'auto'}
          onChange={(e) => updateStyle('backgroundSize', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="auto">auto (原始大小)</option>
          <option value="cover">cover (覆盖)</option>
          <option value="contain">contain (包含)</option>
          <option value="100% 100%">100% 100% (拉伸)</option>
        </select>
      </div>

      {/* 背景位置 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">背景位置 - background-position</label>
        <select
          value={style.backgroundPosition || 'center'}
          onChange={(e) => updateStyle('backgroundPosition', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="center">center (居中)</option>
          <option value="top">top (顶部)</option>
          <option value="bottom">bottom (底部)</option>
          <option value="left">left (左侧)</option>
          <option value="right">right (右侧)</option>
          <option value="top left">top left (左上)</option>
          <option value="top right">top right (右上)</option>
          <option value="bottom left">bottom left (左下)</option>
          <option value="bottom right">bottom right (右下)</option>
        </select>
      </div>

      {/* 背景重复 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">背景重复 - background-repeat</label>
        <select
          value={style.backgroundRepeat || 'no-repeat'}
          onChange={(e) => updateStyle('backgroundRepeat', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="no-repeat">no-repeat (不重复)</option>
          <option value="repeat">repeat (平铺)</option>
          <option value="repeat-x">repeat-x (水平重复)</option>
          <option value="repeat-y">repeat-y (垂直重复)</option>
        </select>
      </div>

      {/* 清除背景图 */}
      {style.backgroundImage && (
        <button
          onClick={() => {
            updateStyle('backgroundImage', '');
            updateStyle('backgroundImageUrl', '');
          }}
          className="w-full py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50"
        >
          清除背景图/渐变
        </button>
      )}
    </div>
  );
}

window.BackgroundPanel = BackgroundPanel;
