// 节点属性面板
function NodeProperties({ node, forms, fields, pages, nodes, dataFlows, onUpdate, onEdit, onDelete }) {
  if (!node) {
    return (
      <div className="p-4">
        <div className="text-gray-400 text-center py-12">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>选择一个节点</p>
          <p className="text-sm mt-1">查看和编辑属性</p>
        </div>
      </div>
    );
  }

  const primitive = window.PrimitiveRegistry.get(node.type);
  
  const getColorClass = (color) => {
    const map = { green: 'bg-green-500', red: 'bg-red-500', blue: 'bg-blue-500', yellow: 'bg-yellow-500', orange: 'bg-orange-500', purple: 'bg-purple-500', indigo: 'bg-indigo-500', gray: 'bg-gray-500' };
    return map[color] || map.gray;
  };

  const getFormName = (formId) => forms.find(f => f.id === formId)?.name || formId || '未设置';
  const getPageName = (pageId) => pages.find(p => p.id === pageId)?.name || pageId || '未设置';
  const getNodeName = (nodeId) => nodes.find(n => n.id === nodeId)?.name || nodeId || '无';

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded flex items-center justify-center text-white ${getColorClass(primitive?.color)}`}>
            <span className="text-lg">{primitive?.icon || '?'}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{node.name}</h3>
            <p className="text-xs text-gray-500">{node.id}</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2">基本信息</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">类型</span>
              <span className="font-medium">{primitive?.name || node.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">下一节点</span>
              <span>{node.next ? getNodeName(node.next) : '无'}</span>
            </div>
          </div>
        </div>
        
        <hr className="border-gray-200" />
        
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2">配置</h4>
          {primitive?.toDocument && (
            <div className="bg-gray-50 rounded p-2 text-sm text-gray-700">
              {primitive.toDocument(node.config || {})}
            </div>
          )}
          {node.config && Object.keys(node.config).length > 0 && (
            <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-2 font-mono overflow-x-auto">
              {JSON.stringify(node.config, null, 2)}
            </div>
          )}
        </div>
        
        {node.branches && (
          <>
            <hr className="border-gray-200" />
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">分支</h4>
              {typeof node.branches === 'object' && !Array.isArray(node.branches) && (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-600">是 →</span>
                    <span>{getNodeName(node.branches.yes)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">否 →</span>
                    <span>{getNodeName(node.branches.no)}</span>
                  </div>
                </div>
              )}
              {Array.isArray(node.branches) && (
                <div className="space-y-1 text-sm">
                  {node.branches.map((b, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-orange-600">{b.isDefault ? '其他' : (b.label || b.value)} →</span>
                      <span>{getNodeName(b.next)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button onClick={onEdit} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          编辑节点
        </button>
        {primitive?.canDelete !== false && (
          <button onClick={onDelete} className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm">
            删除节点
          </button>
        )}
      </div>
    </div>
  );
}

window.NodeProperties = NodeProperties;
