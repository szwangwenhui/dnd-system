// 样式面板容器组件
// 响应式设计：右侧纵向布局，底部横向布局
function StylePanel({ 
  block, 
  onUpdate, 
  position, 
  onPositionChange,
  onClose 
}) {
  // 面板折叠状态（纵向模式用）
  const [expandedPanels, setExpandedPanels] = React.useState({
    type: true,
    preset: false,
    dataBinding: false,
    boxModel: true,
    typography: false,
    background: false,
    border: false,
    shadow: false,
    position: false,
    flex: false,
    grid: false,
    transition: false,
    interaction: false
  });

  // 横向模式下当前打开的面板
  const [activePanel, setActivePanel] = React.useState(null);

  // 拖拽状态
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });

  // 判断是否为底部横向模式（当面板位置在屏幕下半部分时）
  const isHorizontalMode = position.y > window.innerHeight * 0.6;

  // 切换面板展开状态（纵向模式）
  const togglePanel = (panelName) => {
    setExpandedPanels(prev => ({
      ...prev,
      [panelName]: !prev[panelName]
    }));
  };

  // 切换活动面板（横向模式）
  const toggleActivePanel = (panelKey) => {
    setActivePanel(prev => prev === panelKey ? null : panelKey);
  };

  // 开始拖拽
  const handleMouseDown = (e) => {
    if (e.target.closest('.panel-header')) {
      e.preventDefault();
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  // 拖拽处理
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        onPositionChange({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // 切换模式时关闭弹出面板
  React.useEffect(() => {
    setActivePanel(null);
  }, [isHorizontalMode]);

  if (!block) return null;

  // 面板配置
  const panels = [
    { key: 'type', title: '区块类型', icon: '📦', content: (
      <div className="space-y-2">
        <select value={block.type || '显示'} onChange={(e) => onUpdate({ type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
          <option value="显示">显示 (展示信息)</option>
          <option value="交互">交互 (接收信息)</option>
          <option value="按钮">按钮 (触发操作)</option>
        </select>
        <p className="text-xs text-gray-500">
          {block.type === '显示' && '用于展示标题、列表、详情等内容'}
          {block.type === '交互' && '用于输入框、下拉选择、文件上传等'}
          {block.type === '按钮' && '用于提交、确认、操作等按钮'}
        </p>
      </div>
    )},
    { key: 'preset', title: '样式预设', icon: '🎨', content: <PresetPanel block={block} onUpdate={onUpdate} /> },
    { key: 'dataBinding', title: '数据绑定', icon: '🔗', content: <DataBindingPanel block={block} onUpdate={onUpdate} /> },
    { key: 'boxModel', title: '盒模型', icon: '📐', content: <BoxModelPanel block={block} onUpdate={onUpdate} /> },
    { key: 'typography', title: '排版', icon: '🔤', content: <TypographyPanel block={block} onUpdate={onUpdate} /> },
    { key: 'background', title: '背景', icon: '🖼️', content: <BackgroundPanel block={block} onUpdate={onUpdate} /> },
    { key: 'border', title: '边框', icon: '🔲', content: <BorderPanel block={block} onUpdate={onUpdate} /> },
    { key: 'shadow', title: '阴影', icon: '🌑', content: <ShadowPanel block={block} onUpdate={onUpdate} /> },
    { key: 'position', title: '定位', icon: '📍', content: <PositionPanel block={block} onUpdate={onUpdate} /> },
    { key: 'flex', title: 'Flex', icon: '📊', content: <FlexPanel block={block} onUpdate={onUpdate} /> },
    { key: 'grid', title: 'Grid', icon: '⊞', content: <GridPanel block={block} onUpdate={onUpdate} /> },
    { key: 'transition', title: '动画', icon: '✨', content: <TransitionPanel block={block} onUpdate={onUpdate} /> },
    { key: 'interaction', title: '交互', icon: '👆', content: <InteractionPanel block={block} onUpdate={onUpdate} /> }
  ];

  // 横向模式渲染
  if (isHorizontalMode) {
    return (
      <div
        className="fixed bg-white rounded-t-lg shadow-xl border border-gray-200 z-50"
        style={{
          left: position.x,
          top: position.y,
          minWidth: '800px',
          maxWidth: 'calc(100vw - 40px)',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* 标题栏 */}
        <div className="panel-header px-4 py-2 bg-gray-100 rounded-t-lg cursor-move flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-700">样式面板</span>
            <span className="text-xs text-blue-600 font-mono bg-blue-50 px-1.5 py-0.5 rounded">{block.id}</span>
            <span className="text-xs text-gray-400">(横向模式)</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>
        
        {/* 横向菜单栏 */}
        <div className="flex items-center px-2 py-1 bg-gray-50 border-b border-gray-200 overflow-x-auto relative">
          {panels.map(panel => (
            <button
              key={panel.key}
              onClick={() => toggleActivePanel(panel.key)}
              className={`flex items-center space-x-1 px-3 py-1.5 mx-0.5 rounded text-sm whitespace-nowrap transition-colors ${
                activePanel === panel.key 
                  ? 'bg-blue-500 text-white' 
                  : 'hover:bg-gray-200 text-gray-700'
              }`}
              title={panel.title}
            >
              <span>{panel.icon}</span>
              <span className="hidden sm:inline">{panel.title}</span>
            </button>
          ))}
        </div>

        {/* 向上弹出的面板内容 */}
        {activePanel && (
          <div 
            className="absolute left-0 right-0 bg-white border border-gray-200 rounded-t-lg shadow-lg overflow-hidden"
            style={{
              bottom: '100%',
              marginBottom: '4px',
              maxHeight: '400px',
            }}
          >
            <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>{panels.find(p => p.key === activePanel)?.icon}</span>
                <span className="font-medium text-gray-700">{panels.find(p => p.key === activePanel)?.title}</span>
              </div>
              <button onClick={() => setActivePanel(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-4 overflow-y-auto" style={{ maxHeight: '350px' }}>
              {panels.find(p => p.key === activePanel)?.content}
            </div>
          </div>
        )}

        {/* 底部提示 */}
        <div className="px-4 py-1 bg-gray-50 text-center">
          <p className="text-xs text-gray-400">拖动标题栏移动 · 点击菜单展开设置</p>
        </div>
      </div>
    );
  }

  // 纵向模式渲染（原有逻辑）
  return (
    <div
      className="fixed bg-white rounded-lg shadow-xl border border-gray-200 w-80 z-50 flex flex-col"
      style={{
        left: position.x,
        top: position.y,
        maxHeight: 'calc(100vh - 80px)',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* 面板标题栏 */}
      <div className="panel-header px-4 py-2 bg-gray-100 rounded-t-lg cursor-move flex items-center justify-between border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-700">样式面板</span>
          <span className="text-xs text-blue-600 font-mono bg-blue-50 px-1.5 py-0.5 rounded">{block.id}</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
      </div>
      
      {/* 面板内容 */}
      <div className="flex-1 overflow-y-auto">
        {panels.map(panel => (
          <div key={panel.key} className="border-b border-gray-100 last:border-b-0">
            <button
              onClick={() => togglePanel(panel.key)}
              className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <span>{panel.icon}</span>
                <span className="text-sm font-medium text-gray-700">{panel.title}</span>
              </div>
              <span className={`text-gray-400 transition-transform ${expandedPanels[panel.key] ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {expandedPanels[panel.key] && (
              <div className="px-4 pb-3">{panel.content}</div>
            )}
          </div>
        ))}
      </div>

      {/* 底部提示 */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex-shrink-0">
        <p className="text-xs text-gray-400 text-center">拖动标题栏移动 · 拖到底部切换横向</p>
      </div>
    </div>
  );
}

window.StylePanel = StylePanel;
console.log('[DND2] StylePanel.jsx 加载完成 - 支持响应式布局');
