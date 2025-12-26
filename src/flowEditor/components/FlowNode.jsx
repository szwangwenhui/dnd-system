// 画布上的节点组件 - 支持动态连接点位置
// 节点尺寸：84px宽（原120px的70%）
function FlowNode({ 
  node, 
  isSelected, 
  onMouseDown, 
  onDoubleClick, 
  onOutputClick, 
  onInputClick, 
  onInputMouseUp, 
  onDelete, 
  isConnecting,
  inputSide = 'top',      // 输入点位置：top/left/right
  outputSide = 'bottom',  // 输出点位置：bottom/left/right
  secondaryInputSide = null,  // 第二输入点位置（循环节点）
  outputSides = null      // 多输出点位置数组（分支节点）
}) {
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
  const isLoop = node.type === 'loop' || node.type === 'loopStart';

  // 获取连接点的位置样式
  const getPortStyle = (side, isInput = true) => {
    const baseStyle = {
      position: 'absolute',
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };
    
    switch (side) {
      case 'top':
        return {
          ...baseStyle,
          top: '-12px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '24px',
          height: '24px'
        };
      case 'bottom':
        return {
          ...baseStyle,
          bottom: '-12px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '24px',
          height: '24px'
        };
      case 'left':
        return {
          ...baseStyle,
          left: '-12px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '24px',
          height: '24px'
        };
      case 'right':
        return {
          ...baseStyle,
          right: '-12px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '24px',
          height: '24px'
        };
      default:
        return baseStyle;
    }
  };

  // 处理输入点点击
  const handleInputPointClick = (e, inputType = 'default') => {
    e.preventDefault();
    e.stopPropagation();
    console.log('输入点被点击，节点:', node.id, '类型:', inputType);
    if (onInputClick) onInputClick(e, inputType);
  };

  // 处理输入点鼠标松开
  const handleInputPointMouseUp = (e, inputType = 'default') => {
    e.preventDefault();
    e.stopPropagation();
    console.log('输入点鼠标松开，节点:', node.id, '类型:', inputType);
    if (onInputMouseUp) onInputMouseUp(e, inputType);
  };

  // 处理输出点点击/按下
  const handleOutputPointMouseDown = (e, outputType) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('输出点被按下，节点:', node.id, '类型:', outputType);
    if (onOutputClick) onOutputClick(e, outputType);
  };

  // 渲染输入点
  const renderInputPort = (side, inputType = 'default', label = null) => {
    return (
      <div
        key={`input-${inputType}`}
        data-connection-point={`input-${inputType}`}
        style={getPortStyle(side, true)}
      >
        <div
          className={`w-4 h-4 rounded-full border-2 cursor-pointer transition-all ${
            isConnecting 
              ? 'bg-blue-500 border-blue-300 scale-125 shadow-lg shadow-blue-500/50' 
              : 'bg-gray-500 border-gray-300 hover:bg-blue-500 hover:border-blue-300 hover:scale-125'
          }`}
          onClick={(e) => handleInputPointClick(e, inputType)}
          onMouseUp={(e) => handleInputPointMouseUp(e, inputType)}
          title={label || "连接到此节点"}
        />
        {label && (
          <span className="absolute text-[8px] text-gray-400 whitespace-nowrap"
            style={{
              [side === 'left' ? 'right' : side === 'right' ? 'left' : side === 'top' ? 'bottom' : 'top']: '16px',
              ...(side === 'left' || side === 'right' 
                ? { top: '50%', transform: 'translateY(-50%)' }
                : { left: '50%', transform: 'translateX(-50%)' }
              )
            }}
          >
            {label}
          </span>
        )}
      </div>
    );
  };

  // 渲染输出点
  const renderOutputPort = (side, outputType = 'default', label = null, colorClass = null) => {
    const portColorClass = colorClass 
      ? colorClass 
      : `${colors.light} border-2 ${colors.border}`;
    
    return (
      <div
        key={`output-${outputType}`}
        data-connection-point={`output-${outputType}`}
        style={getPortStyle(side, false)}
        className="cursor-pointer"
        onMouseDown={(e) => handleOutputPointMouseDown(e, outputType)}
      >
        <div
          className={`w-4 h-4 rounded-full ${portColorClass} hover:scale-125 transition-all`}
          title={label || "从此节点连出"}
        />
        {label && (
          <span className={`absolute text-[8px] whitespace-nowrap ${
            outputType === 'yes' ? 'text-green-400' : 
            outputType === 'no' ? 'text-red-400' : 'text-gray-400'
          }`}
            style={{
              [side === 'bottom' ? 'top' : side === 'top' ? 'bottom' : side === 'left' ? 'right' : 'left']: '16px',
              ...(side === 'left' || side === 'right' 
                ? { top: '50%', transform: 'translateY(-50%)' }
                : { left: '50%', transform: 'translateX(-50%)' }
              )
            }}
          >
            {label}
          </span>
        )}
      </div>
    );
  };

  // 判断是否显示输入点
  const hasInput = primitive?.connections?.hasInput !== false && node.type !== 'start';
  // 判断是否显示输出点
  const hasOutput = primitive?.connections?.hasOutput !== false && node.type !== 'end';

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
      {/* 输入点 */}
      {hasInput && (
        <>
          {/* 主输入点 */}
          {renderInputPort(inputSide, 'default')}
          
          {/* 第二输入点（循环节点的循环跳回） */}
          {isLoop && secondaryInputSide && (
            renderInputPort(secondaryInputSide, 'loop', '循环')
          )}
        </>
      )}
      
      {/* 节点主体 - 缩小到70% */}
      <div
        className={`w-[84px] rounded-lg border-2 overflow-hidden transition-shadow ${
          isSelected ? 'shadow-lg shadow-blue-500/30 ring-2 ring-blue-500' : 'shadow-md'
        } ${colors.border}`}
        style={{ backgroundColor: '#2d2d3a' }}
      >
        {/* 头部 */}
        <div className={`px-1.5 py-1 ${colors.bg} flex items-center space-x-1`}>
          <span className="text-white text-xs">{primitive?.icon || '?'}</span>
          <span className="text-white text-[10px] font-medium truncate flex-1">{node.name}</span>
        </div>
        
        {/* 内容 */}
        <div className="px-1.5 py-1.5 text-[9px] text-gray-400">
          <div className="truncate">{node.id}</div>
          {primitive?.toDocument && (
            <div className="truncate mt-0.5 text-gray-500">
              {primitive.toDocument(node.config || {}).substring(0, 15)}...
            </div>
          )}
        </div>
        
        {/* 删除按钮 */}
        {isSelected && primitive?.canDelete !== false && (
          <button
            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center hover:bg-red-600"
            style={{ zIndex: 60 }}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            ×
          </button>
        )}
      </div>
      
      {/* 输出点 */}
      {hasOutput && (
        <>
          {isBranch && primitive.branchType === 'binary' ? (
            // 是非分叉：两个输出点在底部，分开放置避免汇聚
            <>
              <div
                data-connection-point="output-yes"
                className="absolute cursor-pointer"
                style={{ bottom: '-12px', left: '20%', transform: 'translateX(-50%)', zIndex: 50 }}
                onMouseDown={(e) => handleOutputPointMouseDown(e, 'yes')}
              >
                <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-green-300 hover:scale-125 transition-all" />
                <span className="text-[8px] text-green-400 absolute top-4 left-1/2 -translate-x-1/2">是</span>
              </div>
              <div
                data-connection-point="output-no"
                className="absolute cursor-pointer"
                style={{ bottom: '-12px', left: '80%', transform: 'translateX(-50%)', zIndex: 50 }}
                onMouseDown={(e) => handleOutputPointMouseDown(e, 'no')}
              >
                <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-300 hover:scale-125 transition-all" />
                <span className="text-[8px] text-red-400 absolute top-4 left-1/2 -translate-x-1/2">否</span>
              </div>
            </>
          ) : outputSides && outputSides.length > 1 ? (
            // 多输出点（多条件分支）
            outputSides.map((sideInfo, index) => {
              const side = typeof sideInfo === 'string' ? sideInfo : sideInfo.side;
              const label = typeof sideInfo === 'object' ? sideInfo.label : `分支${index + 1}`;
              return renderOutputPort(side, `branch-${index}`, label);
            })
          ) : (
            // 普通输出点
            renderOutputPort(outputSide, 'default')
          )}
        </>
      )}
    </div>
  );
}

window.FlowNode = FlowNode;
