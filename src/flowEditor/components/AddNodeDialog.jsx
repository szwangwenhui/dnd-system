// 添加节点对话框
function AddNodeDialog({ onClose, onSelect }) {
  const [expandedCategories, setExpandedCategories] = React.useState({
    flow: true,
    data: true,
    branch: true,
    interact: false,
    control: false,
    validate: false,
    calculate: false,
    external: false
  });

  const toggleCategory = (catId) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const categories = [
    { id: 'flow', name: '流程节点', icon: '⚡' },
    { id: 'data', name: '数据操作', icon: '📊' },
    { id: 'branch', name: '分支控制', icon: '◇' },
    { id: 'interact', name: '交互操作', icon: '💬' },
    { id: 'control', name: '流程控制', icon: '↺' },
    { id: 'validate', name: '校验操作', icon: '✓' },
    { id: 'calculate', name: '计算操作', icon: 'ƒ' },
    { id: 'external', name: '外部调用', icon: '⚡' }
  ];

  const getColorClass = (color) => {
    const map = {
      green: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200',
      red: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200',
      indigo: 'bg-indigo-100 text-indigo-700 border-indigo-300 hover:bg-indigo-200',
      gray: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
    };
    return map[color] || map.gray;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[500px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">添加节点</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {categories.map(cat => {
            const primitives = window.PrimitiveRegistry.getByCategory(cat.id);
            // 过滤掉开始节点（只能有一个）
            const availablePrimitives = primitives.filter(p => p.id !== 'start');
            if (availablePrimitives.length === 0) return null;
            
            return (
              <div key={cat.id} className="mb-3">
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded"
                >
                  <span className="flex items-center space-x-2">
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                    <span className="text-xs text-gray-400">({availablePrimitives.length})</span>
                  </span>
                  <svg className={`w-4 h-4 transform transition-transform ${expandedCategories[cat.id] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {expandedCategories[cat.id] && (
                  <div className="mt-1 ml-4 grid grid-cols-2 gap-2">
                    {availablePrimitives.map(primitive => (
                      <button
                        key={primitive.id}
                        onClick={() => onSelect(primitive.id)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded border text-sm text-left transition-colors ${getColorClass(primitive.color)}`}
                      >
                        <span className="text-lg">{primitive.icon}</span>
                        <div>
                          <div className="font-medium">{primitive.name}</div>
                          <div className="text-xs opacity-75 truncate">{primitive.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100">
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

window.AddNodeDialog = AddNodeDialog;
