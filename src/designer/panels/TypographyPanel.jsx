// 排版样式面板
// 包含：字体、字号、字重、行高、对齐、颜色、间距等
function TypographyPanel({ block, onUpdate }) {
  if (!block) return null;

  const style = block.style || {};

  // 更新样式
  const updateStyle = (key, value) => {
    onUpdate({
      style: { ...style, [key]: value }
    });
  };

  // 常用字体列表
  const fontFamilies = [
    { value: 'inherit', label: '继承父级' },
    { value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', label: '系统默认' },
    { value: '"Microsoft YaHei", "微软雅黑", sans-serif', label: '微软雅黑' },
    { value: '"PingFang SC", "苹方", sans-serif', label: '苹方' },
    { value: '"SimSun", "宋体", serif', label: '宋体' },
    { value: '"SimHei", "黑体", sans-serif', label: '黑体' },
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: '"Courier New", monospace', label: 'Courier New' },
  ];

  return (
    <div className="space-y-3">
      {/* 字体 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">字体 - font-family</label>
        <select
          value={style.fontFamily || 'inherit'}
          onChange={(e) => updateStyle('fontFamily', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        >
          {fontFamilies.map(font => (
            <option key={font.value} value={font.value}>{font.label}</option>
          ))}
        </select>
      </div>

      {/* 字号和字重 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">字号 (px)</label>
          <input
            type="number"
            value={style.fontSize || 14}
            min="10"
            max="72"
            onChange={(e) => updateStyle('fontSize', parseInt(e.target.value) || 14)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">字重</label>
          <select
            value={style.fontWeight || 'normal'}
            onChange={(e) => updateStyle('fontWeight', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="normal">normal (正常)</option>
            <option value="bold">bold (粗体)</option>
            <option value="100">100 (极细)</option>
            <option value="200">200</option>
            <option value="300">300 (细)</option>
            <option value="400">400 (正常)</option>
            <option value="500">500 (中等)</option>
            <option value="600">600 (半粗)</option>
            <option value="700">700 (粗)</option>
            <option value="800">800</option>
            <option value="900">900 (极粗)</option>
          </select>
        </div>
      </div>

      {/* 行高和字间距 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">行高</label>
          <input
            type="number"
            value={style.lineHeight || 1.5}
            min="0.5"
            max="3"
            step="0.1"
            onChange={(e) => updateStyle('lineHeight', parseFloat(e.target.value) || 1.5)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">字间距 (px)</label>
          <input
            type="number"
            value={style.letterSpacing || 0}
            min="-5"
            max="20"
            onChange={(e) => updateStyle('letterSpacing', parseInt(e.target.value) || 0)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>

      {/* 文字颜色 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">文字颜色 - color</label>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={style.color || '#333333'}
            onChange={(e) => updateStyle('color', e.target.value)}
            className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
          />
          <input
            type="text"
            value={style.color || '#333333'}
            onChange={(e) => updateStyle('color', e.target.value)}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-mono"
          />
        </div>
      </div>

      {/* 水平对齐 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">水平对齐 - text-align</label>
        <div className="flex space-x-1">
          {[
            { value: 'left', icon: '◀', label: '左' },
            { value: 'center', icon: '◆', label: '中' },
            { value: 'right', icon: '▶', label: '右' },
            { value: 'justify', icon: '≡', label: '两端' }
          ].map(align => (
            <button
              key={align.value}
              onClick={() => updateStyle('textAlign', align.value)}
              className={`flex-1 py-1 text-sm rounded border ${
                style.textAlign === align.value
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
              title={align.label}
            >
              {align.icon}
            </button>
          ))}
        </div>
      </div>

      {/* 垂直对齐 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">垂直对齐 - vertical-align</label>
        <select
          value={style.verticalAlign || 'baseline'}
          onChange={(e) => updateStyle('verticalAlign', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="baseline">baseline (基线)</option>
          <option value="top">top (顶部)</option>
          <option value="middle">middle (居中)</option>
          <option value="bottom">bottom (底部)</option>
          <option value="text-top">text-top (文字顶部)</option>
          <option value="text-bottom">text-bottom (文字底部)</option>
        </select>
      </div>

      {/* 文字装饰 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">文字装饰 - text-decoration</label>
        <div className="flex space-x-1">
          {[
            { value: 'none', label: '无' },
            { value: 'underline', label: '下划线' },
            { value: 'line-through', label: '删除线' },
            { value: 'overline', label: '上划线' }
          ].map(dec => (
            <button
              key={dec.value}
              onClick={() => updateStyle('textDecoration', dec.value)}
              className={`flex-1 py-1 text-xs rounded border ${
                style.textDecoration === dec.value
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {dec.label}
            </button>
          ))}
        </div>
      </div>

      {/* 字体样式 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">字体样式 - font-style</label>
        <div className="flex space-x-2">
          <button
            onClick={() => updateStyle('fontStyle', style.fontStyle === 'italic' ? 'normal' : 'italic')}
            className={`flex-1 py-1 text-sm rounded border ${
              style.fontStyle === 'italic'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <em>斜体</em>
          </button>
          <button
            onClick={() => updateStyle('textTransform', style.textTransform === 'uppercase' ? 'none' : 'uppercase')}
            className={`flex-1 py-1 text-sm rounded border ${
              style.textTransform === 'uppercase'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            大写
          </button>
        </div>
      </div>

      {/* 文字溢出 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">文字溢出 - text-overflow</label>
        <select
          value={style.textOverflow || 'clip'}
          onChange={(e) => updateStyle('textOverflow', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="clip">clip (裁剪)</option>
          <option value="ellipsis">ellipsis (省略号)</option>
        </select>
      </div>

      {/* 首行缩进 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">首行缩进 - text-indent (px)</label>
        <input
          type="number"
          value={style.textIndent || 0}
          onChange={(e) => updateStyle('textIndent', parseInt(e.target.value) || 0)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        />
      </div>
    </div>
  );
}

window.TypographyPanel = TypographyPanel;
