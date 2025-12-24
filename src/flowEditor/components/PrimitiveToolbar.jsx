// 原语工具栏 - 小图标，可拖拽
function PrimitiveToolbar() {
  const [expandedCat, setExpandedCat] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  // 组件挂载后强制刷新一次，确保原语已注册
  React.useEffect(() => {
    const timer = setTimeout(() => forceUpdate(), 100);
    return () => clearTimeout(timer);
  }, []);

  // 分类与原语注册表一致
  const categories = [
    { id: 'data', name: '数据', icon: '📊', color: 'blue' },
    { id: 'branch', name: '分支', icon: '◇', color: 'yellow' },
    { id: 'interact', name: '交互', icon: '💬', color: 'green' },
    { id: 'loop', name: '循环', icon: '↺', color: 'purple' },
    { id: 'validate', name: '校验', icon: '✓', color: 'orange' },
    { id: 'calculate', name: '计算', icon: 'ƒ', color: 'indigo' },
    { id: 'external', name: '外部', icon: '⚡', color: 'red' }
  ];

  const handleDragStart = (e, primitiveId) => {
    console.log('开始拖拽:', primitiveId);
    // 设置多种数据格式，确保兼容性
    e.dataTransfer.setData('text/plain', primitiveId);
    e.dataTransfer.setData('primitiveId', primitiveId);
    e.dataTransfer.effectAllowed = 'copy';
    setIsDragging(true);
    // 延迟关闭菜单，让拖拽数据先设置好
    setTimeout(() => setExpandedCat(null), 100);
  };

  const handleDragEnd = (e) => {
    console.log('拖拽结束');
    setIsDragging(false);
  };

  const getColorClass = (color) => {
    const colors = {
      blue: 'bg-blue-500', yellow: 'bg-yellow-500', green: 'bg-green-500',
      purple: 'bg-purple-500', orange: 'bg-orange-500', indigo: 'bg-indigo-500',
      red: 'bg-red-500', gray: 'bg-gray-500'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="flex flex-col items-center space-y-1">
      {categories.map(cat => {
        const allPrimitives = window.PrimitiveRegistry?.getByCategory?.(cat.id) || [];
        const primitives = allPrimitives.filter(p => p.id !== 'start' && p.id !== 'end');
        if (primitives.length === 0) return null;
        
        return (
          <div key={cat.id} className="relative">
            <button
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors border-2 ${
                expandedCat === cat.id 
                  ? 'bg-blue-600 text-white border-blue-400' 
                  : 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
              }`}
              onClick={() => {
                console.log('点击分类:', cat.name);
                setExpandedCat(expandedCat === cat.id ? null : cat.id);
              }}
              title={`${cat.name} (${primitives.length}个) - 拖拽到画布添加`}
            >
              {cat.icon}
            </button>
            
            {/* 展开的原语列表 */}
            {expandedCat === cat.id && (
              <div className="absolute left-full top-0 ml-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-2 z-50 min-w-[160px]">
                <div className="text-xs text-gray-400 mb-2 px-1">💡 拖拽到画布添加节点</div>
                <div className="space-y-1">
                  {primitives.map(p => (
                    <div
                      key={p.id}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, p.id)}
                      onDragEnd={handleDragEnd}
                      className="flex items-center space-x-2 px-2 py-1.5 rounded cursor-grab hover:bg-gray-700 active:cursor-grabbing select-none"
                    >
                      <span className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs ${getColorClass(p.color)}`}>
                        {p.icon}
                      </span>
                      <span className="text-sm text-gray-200">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
      
      {/* 点击外部关闭 - 拖拽时隐藏遮罩，避免阻挡drop事件 */}
      {expandedCat && !isDragging && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setExpandedCat(null)}
          style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
        />
      )}
    </div>
  );
}

window.PrimitiveToolbar = PrimitiveToolbar;
