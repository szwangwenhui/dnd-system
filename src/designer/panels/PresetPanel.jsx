// 预设样式面板
// 提供快速应用样式预设和主题
function PresetPanel({ block, onUpdate }) {
  if (!block) return null;

  const [activeTab, setActiveTab] = React.useState('presets'); // presets | themes
  const [activeCategory, setActiveCategory] = React.useState('卡片');

  const style = block.style || {};

  // 应用预设样式
  const applyPreset = (presetKey) => {
    const preset = BlockPresets[presetKey];
    if (preset) {
      onUpdate({
        style: { ...style, ...preset.style }
      });
    }
  };

  // 应用主题色
  const applyTheme = (themeKey, target) => {
    const theme = ThemeColors[themeKey];
    if (!theme) return;

    const updates = {};
    switch (target) {
      case 'background':
        updates.backgroundColor = theme.primary;
        break;
      case 'backgroundLight':
        updates.backgroundColor = theme.background;
        break;
      case 'border':
        updates.borderColor = theme.border;
        break;
      case 'text':
        updates.color = theme.text;
        break;
      case 'all':
        updates.backgroundColor = theme.background;
        updates.borderColor = theme.border;
        updates.color = theme.text;
        break;
    }
    onUpdate({ style: { ...style, ...updates } });
  };

  // 获取分类
  const categories = getPresetCategories();
  const categoryNames = Object.keys(categories);

  return (
    <div className="space-y-4">
      {/* 标签切换 */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'presets'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          样式预设
        </button>
        <button
          onClick={() => setActiveTab('themes')}
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'themes'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          主题配色
        </button>
      </div>

      {/* 样式预设 */}
      {activeTab === 'presets' && (
        <div className="space-y-3">
          {/* 分类选择 */}
          <div className="flex flex-wrap gap-1">
            {categoryNames.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2 py-1 text-xs rounded ${
                  activeCategory === cat
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 预设列表 */}
          <div className="grid grid-cols-2 gap-2">
            {categories[activeCategory]?.map(preset => (
              <button
                key={preset.key}
                onClick={() => applyPreset(preset.key)}
                className="p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
              >
                {/* 预览 */}
                <div 
                  className="w-full h-8 rounded mb-2"
                  style={{
                    backgroundColor: preset.style.backgroundColor || '#f3f4f6',
                    borderWidth: preset.style.borderWidth || 0,
                    borderStyle: preset.style.borderStyle || 'solid',
                    borderColor: preset.style.borderColor || 'transparent',
                    borderRadius: Math.min(preset.style.borderRadius || 0, 8),
                    boxShadow: preset.style.boxShadow || 'none'
                  }}
                />
                <span className="text-xs text-gray-700">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 主题配色 */}
      {activeTab === 'themes' && (
        <div className="space-y-4">
          {Object.entries(ThemeColors).map(([key, theme]) => (
            <div key={key} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{theme.name}</span>
                <div className="flex space-x-1">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.primary }} title="主色" />
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.secondary }} title="次色" />
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.background }} title="背景" />
                </div>
              </div>
              
              {/* 应用按钮 */}
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => applyTheme(key, 'background')}
                  className="px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-100"
                >
                  主色背景
                </button>
                <button
                  onClick={() => applyTheme(key, 'backgroundLight')}
                  className="px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-100"
                >
                  浅色背景
                </button>
                <button
                  onClick={() => applyTheme(key, 'border')}
                  className="px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-100"
                >
                  边框
                </button>
                <button
                  onClick={() => applyTheme(key, 'text')}
                  className="px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-100"
                >
                  文字
                </button>
                <button
                  onClick={() => applyTheme(key, 'all')}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  全部
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 快速操作 */}
      <div className="border-t border-gray-200 pt-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">快速操作</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onUpdate({
              style: {
                backgroundColor: '#ffffff',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: '#e5e7eb',
                borderRadius: 0,
                boxShadow: 'none',
                paddingTop: 0,
                paddingRight: 0,
                paddingBottom: 0,
                paddingLeft: 0
              }
            })}
            className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
          >
            🔄 重置样式
          </button>
          <button
            onClick={() => onUpdate({
              style: {
                ...style,
                backgroundColor: 'transparent',
                borderWidth: 0,
                boxShadow: 'none'
              }
            })}
            className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
          >
            👻 透明无框
          </button>
          <button
            onClick={() => {
              const currentBg = style.backgroundColor || '#ffffff';
              // 简单的亮度调整
              onUpdate({
                style: {
                  ...style,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  borderRadius: style.borderRadius || 8
                }
              });
            }}
            className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
          >
            ✨ 添加阴影
          </button>
          <button
            onClick={() => onUpdate({
              style: {
                ...style,
                borderRadius: 9999
              }
            })}
            className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
          >
            ⭕ 变成圆形
          </button>
        </div>
      </div>
    </div>
  );
}

window.PresetPanel = PresetPanel;
