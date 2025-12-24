// 画布上的节点组件
function FlowNode({ node, isSelected, onMouseDown, onDoubleClick, onOutputClick, onInputClick, onInputMouseUp, onDelete, isConnecting }) {
  const primitive = window.PrimitiveRegistry.get(node.type);
  
  const getColorClasses = (color) => {
    const colors = {
      green: { bg: 'bg-green-500', border: 'border-green-400', light: 'bg-green-400' },
      red: { bg: 'bg-red-500', border: 'border-red-400', light: 'bg-red-400' },
      blue: { bg: 'bg-blue-500', border: 'border-blue-400', light: 'bg-blue-400' },
      yellow: { bg: 'bg-yellow-500', border: 'border-yellow-400', light: 'bg-yellow-400' },
      orange: { bg: 'bg-orange-500', border: 'border-orange-400', light: 'bg-orange-400' },
      purple: { bg: 'bg-purple-500', border: 'border-purple-400', light: 'bg-purple-400' },
      indigo: { bg: 'bg-indigo-500', border: 'border-indigo-400', light: 'bg-indigo-400' },
      gray: { bg: 'bg-gray-500', border: 'border-gray-400', light: 'bg-gray-400' }
    };
    return colors[color] || colors.gray;
  };

  const colors = getColorClasses(primitive?.color);
  const isBranch = primitive?.isBranch;

  // 处理输入点点击
  const handleInputPointClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('输入点被点击，节点:', node.id);
    if (onInputClick) onInputClick(e);
  };

  // 处理输入点鼠标松开
  const handleInputPointMouseUp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('输入点鼠标松开，节点:', node.id);
    if (onInputMouseUp) onInputMouseUp(e);
  };

  // 处理输出点点击/按下
  const handleOutputPointMouseDown = (e, outputType) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('输出点被按下，节点:', node.id, '类型:', outputType);
    if (onOutputClick) onOutputClick(e, outputType);
  };

  return (
    <div
      className="absolute select-none"
      style={{ left: node.x, top: node.y }}
      onMouseDown={(e) => {
        // 检查是否点击的是输入/输出点，如果是则不触发节点拖动
        if (e.target.closest('[data-connection-point]')) {
          return;
        }
        onMouseDown(e);
      }}
      onDoubleClick={onDoubleClick}
    >
      {/* 输入点 - 增大点击区域 */}
      {primitive?.connections?.hasInput !== false && node.type !== 'start' && (
        <div
          data-connection-point="input"
          className="absolute -top-4 left-1/2 transform -translate-x-1/2 flex items-center justify-center"
          style={{ width: 32, height: 32, zIndex: 50 }}
        >
          <div
            className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-all ${
              isConnecting 
                ? 'bg-blue-500 border-blue-300 scale-125 shadow-lg shadow-blue-500/50' 
                : 'bg-gray-500 border-gray-300 hover:bg-blue-500 hover:border-blue-300 hover:scale-125'
            }`}
            onClick={handleInputPointClick}
            onMouseUp={handleInputPointMouseUp}
            title="连接到此节点"
          />
        </div>
      )}
      
      {/* 节点主体 */}
      <div
        className={`w-[120px] rounded-lg border-2 overflow-hidden transition-shadow ${
          isSelected ? 'shadow-lg shadow-blue-500/30 ring-2 ring-blue-500' : 'shadow-md'
        } ${colors.border}`}
        style={{ backgroundColor: '#2d2d3a' }}
      >
        {/* 头部 */}
        <div className={`px-2 py-1.5 ${colors.bg} flex items-center space-x-1.5`}>
          <span className="text-white text-sm">{primitive?.icon || '?'}</span>
          <span className="text-white text-xs font-medium truncate flex-1">{node.name}</span>
        </div>
        
        {/* 内容 */}
        <div className="px-2 py-2 text-xs text-gray-400">
          <div className="truncate">{node.id}</div>
          {primitive?.toDocument && (
            <div className="truncate mt-0.5 text-gray-500">
              {primitive.toDocument(node.config || {}).substring(0, 20)}...
            </div>
          )}
        </div>
        
        {/* 删除按钮 */}
        {isSelected && primitive?.canDelete !== false && (
          <button
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-600"
            style={{ zIndex: 60 }}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            ×
          </button>
        )}
      </div>
      
      {/* 输出点 - 增大点击区域 */}
      {primitive?.connections?.hasOutput !== false && node.type !== 'end' && (
        <>
          {isBranch && primitive.branchType === 'binary' ? (
            // 是非分叉：两个输出点
            <>
              <div 
                data-connection-point="output-yes"
                className="absolute -bottom-4 left-1/4 transform -translate-x-1/2 flex flex-col items-center cursor-pointer"
                style={{ zIndex: 50 }}
                onMouseDown={(e) => handleOutputPointMouseDown(e, 'yes')}
              >
                <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-green-300 hover:scale-125 transition-all" />
                <span className="text-[10px] text-green-400 mt-0.5">是</span>
              </div>
              <div 
                data-connection-point="output-no"
                className="absolute -bottom-4 right-1/4 transform translate-x-1/2 flex flex-col items-center cursor-pointer"
                style={{ zIndex: 50 }}
                onMouseDown={(e) => handleOutputPointMouseDown(e, 'no')}
              >
                <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-red-300 hover:scale-125 transition-all" />
                <span className="text-[10px] text-red-400 mt-0.5">否</span>
              </div>
            </>
          ) : (
            // 普通输出点
            <div 
              data-connection-point="output"
              className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex items-center justify-center cursor-pointer"
              style={{ width: 32, height: 32, zIndex: 50 }}
              onMouseDown={(e) => handleOutputPointMouseDown(e, 'default')}
            >
              <div 
                className={`w-5 h-5 rounded-full ${colors.light} border-2 ${colors.border} hover:scale-125 transition-all`}
                title="从此节点连出"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

window.FlowNode = FlowNode;
