// 节点列表组件 - 显示流程中的所有节点
function NodeList({ nodes, selectedNodeId, onSelectNode, onEditNode, onDeleteNode, onAddNode }) {
  
  // 获取节点颜色
  const getNodeColor = (type) => {
    const primitive = window.PrimitiveRegistry.get(type);
    const colorMap = {
      green: 'bg-green-100 border-green-400 text-green-800',
      red: 'bg-red-100 border-red-400 text-red-800',
      blue: 'bg-blue-100 border-blue-400 text-blue-800',
      yellow: 'bg-yellow-100 border-yellow-400 text-yellow-800',
      orange: 'bg-orange-100 border-orange-400 text-orange-800',
      purple: 'bg-purple-100 border-purple-400 text-purple-800',
      indigo: 'bg-indigo-100 border-indigo-400 text-indigo-800',
      gray: 'bg-gray-100 border-gray-400 text-gray-800'
    };
    return colorMap[primitive?.color] || colorMap.gray;
  };

  // 渲染单个节点
  const renderNode = (node, depth = 0) => {
    const primitive = window.PrimitiveRegistry.get(node.type);
    const isSelected = selectedNodeId === node.id;
    const colorClass = getNodeColor(node.type);
    
    return (
      <div key={node.id} className="mb-2" style={{ marginLeft: depth * 24 }}>
        {/* 节点卡片 */}
        <div
          className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${colorClass} ${
            isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:shadow-md'
          }`}
          onClick={() => onSelectNode(node.id)}
          onDoubleClick={() => onEditNode(node)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{primitive?.icon || '?'}</span>
              <div>
                <div className="font-medium text-sm">{node.name}</div>
                <div className="text-xs opacity-75">{node.id} · {primitive?.name || node.type}</div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={(e) => { e.stopPropagation(); onEditNode(node); }}
                className="p-1 hover:bg-white hover:bg-opacity-50 rounded"
                title="编辑"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              {primitive?.canDelete !== false && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteNode(node.id); }}
                  className="p-1 hover:bg-white hover:bg-opacity-50 rounded text-red-600"
                  title="删除"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* 显示配置摘要 */}
          {primitive?.toDocument && node.config && Object.keys(node.config).length > 0 && (
            <div className="mt-2 text-xs opacity-75 truncate">
              {primitive.toDocument(node.config)}
            </div>
          )}
        </div>
        
        {/* 连接线和添加按钮 */}
        {node.type !== 'end' && !node.branches && (
          <div className="flex items-center justify-center my-1">
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-3 bg-gray-300"></div>
              <button
                onClick={() => onAddNode(node.id, null)}
                className="w-6 h-6 rounded-full bg-gray-200 hover:bg-blue-500 hover:text-white flex items-center justify-center text-gray-500 transition-colors"
                title="在此处添加节点"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <div className="w-0.5 h-3 bg-gray-300"></div>
              <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 16l-6-6h12z" />
              </svg>
            </div>
          </div>
        )}
        
        {/* 分支节点的分支显示 */}
        {node.branches && typeof node.branches === 'object' && !Array.isArray(node.branches) && (
          <div className="mt-2 ml-4">
            {/* 是分支 */}
            <div className="flex items-start mb-2">
              <div className="flex items-center mr-2">
                <div className="w-8 h-0.5 bg-green-400"></div>
                <span className="text-xs text-green-600 font-medium px-1 bg-green-50 rounded">是</span>
              </div>
              <div className="flex-1">
                <button
                  onClick={() => onAddNode(node.id, 'yes')}
                  className="w-full py-1 px-2 border-2 border-dashed border-green-300 rounded text-green-600 text-xs hover:bg-green-50"
                >
                  + 添加"是"分支步骤
                </button>
                {node.branches.yes && renderBranchNodes(node.branches.yes, 1)}
              </div>
            </div>
            {/* 否分支 */}
            <div className="flex items-start">
              <div className="flex items-center mr-2">
                <div className="w-8 h-0.5 bg-red-400"></div>
                <span className="text-xs text-red-600 font-medium px-1 bg-red-50 rounded">否</span>
              </div>
              <div className="flex-1">
                <button
                  onClick={() => onAddNode(node.id, 'no')}
                  className="w-full py-1 px-2 border-2 border-dashed border-red-300 rounded text-red-600 text-xs hover:bg-red-50"
                >
                  + 添加"否"分支步骤
                </button>
                {node.branches.no && renderBranchNodes(node.branches.no, 1)}
              </div>
            </div>
          </div>
        )}
        
        {/* 多分支节点 */}
        {node.branches && Array.isArray(node.branches) && (
          <div className="mt-2 ml-4 space-y-2">
            {node.branches.map((branch, idx) => (
              <div key={idx} className="flex items-start">
                <div className="flex items-center mr-2">
                  <div className="w-8 h-0.5 bg-orange-400"></div>
                  <span className="text-xs text-orange-600 font-medium px-1 bg-orange-50 rounded">
                    {branch.isDefault ? '其他' : (branch.label || branch.value || `选项${idx + 1}`)}
                  </span>
                </div>
                <div className="flex-1">
                  <button
                    onClick={() => onAddNode(node.id, idx)}
                    className="w-full py-1 px-2 border-2 border-dashed border-orange-300 rounded text-orange-600 text-xs hover:bg-orange-50"
                  >
                    + 添加步骤
                  </button>
                  {branch.next && renderBranchNodes(branch.next, 1)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 渲染分支中的节点链
  const renderBranchNodes = (nodeId, depth) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;
    return (
      <div className="mt-1">
        {renderNode(node, depth)}
      </div>
    );
  };

  // 构建节点显示顺序（从开始节点遍历）
  const buildNodeSequence = () => {
    const startNode = nodes.find(n => n.type === 'start');
    if (!startNode) return nodes;
    
    const sequence = [];
    const visited = new Set();
    
    const traverse = (nodeId) => {
      if (!nodeId || visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      
      sequence.push(node);
      
      // 顺序节点
      if (node.next && !node.branches) {
        traverse(node.next);
      }
    };
    
    traverse(startNode.id);
    
    // 添加未被访问的节点（孤立节点）
    nodes.forEach(n => {
      if (!visited.has(n.id)) {
        sequence.push(n);
      }
    });
    
    return sequence;
  };

  const orderedNodes = buildNodeSequence();
  // 只显示主流程节点（不在分支中的）
  const mainNodes = orderedNodes.filter(n => {
    // 检查是否被其他节点的分支引用
    const isInBranch = nodes.some(other => {
      if (other.branches) {
        if (typeof other.branches === 'object' && !Array.isArray(other.branches)) {
          return other.branches.yes === n.id || other.branches.no === n.id;
        }
        if (Array.isArray(other.branches)) {
          return other.branches.some(b => b.next === n.id);
        }
      }
      return false;
    });
    return !isInBranch;
  });

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">流程节点</h2>
        <span className="text-sm text-gray-500">{nodes.length} 个节点</span>
      </div>
      
      <div className="space-y-1">
        {mainNodes.map(node => renderNode(node, 0))}
      </div>
      
      {nodes.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          暂无节点
        </div>
      )}
    </div>
  );
}

window.NodeList = NodeList;
