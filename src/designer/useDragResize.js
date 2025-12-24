// DND2 页面设计器 - 拖拽和缩放Hook
// 原文件: src/designer/PageDesigner.jsx 第1057-1210行
// Phase 5 拆分: 文件 4/5
//
// 提供拖拽和缩放的状态管理和事件处理

function useDragResize(blocks, setBlocks, scale, setHasChanges, setSelectedBlockId, setShowPanel, saveToHistory) {
  // 拖拽状态
  const [dragState, setDragState] = React.useState({
    isDragging: false, blockId: null, startX: 0, startY: 0, startBlockX: 0, startBlockY: 0
  });

  // 缩放状态
  const [resizeState, setResizeState] = React.useState({
    isResizing: false, blockId: null, direction: '', startX: 0, startY: 0,
    startWidth: 0, startHeight: 0, startBlockX: 0, startBlockY: 0
  });

  // 开始拖拽
  const handleBlockDragStart = (e, blockId) => {
    e.stopPropagation();
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    setDragState({
      isDragging: true, blockId, startX: e.clientX, startY: e.clientY,
      startBlockX: block.x, startBlockY: block.y
    });
    setSelectedBlockId(blockId);
    setShowPanel(true);
  };

  // 开始缩放
  const handleBlockResizeStart = (e, blockId, direction) => {
    e.stopPropagation();
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    setResizeState({
      isResizing: true, blockId, direction, startX: e.clientX, startY: e.clientY,
      startWidth: block.width, startHeight: block.height,
      startBlockX: block.x, startBlockY: block.y
    });
  };

  // 获取所有下级区块（递归）
  const getAllDescendantsForDrag = (blockId, allBlocks) => {
    const descendants = [];
    const children = allBlocks.filter(b => b.parentId === blockId);
    children.forEach(child => {
      descendants.push(child);
      descendants.push(...getAllDescendantsForDrag(child.id, allBlocks));
    });
    return descendants;
  };

  // 鼠标移动和释放事件处理
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      if (dragState.isDragging) {
        const deltaX = (e.clientX - dragState.startX) / (scale / 100);
        const deltaY = (e.clientY - dragState.startY) / (scale / 100);
        const newX = Math.max(0, Math.round(dragState.startBlockX + deltaX));
        const newY = Math.max(0, Math.round(dragState.startBlockY + deltaY));
        
        const draggedBlock = blocks.find(b => b.id === dragState.blockId);
        if (!draggedBlock) return;
        
        const moveX = newX - draggedBlock.x;
        const moveY = newY - draggedBlock.y;
        const descendants = getAllDescendantsForDrag(dragState.blockId, blocks);
        
        const newBlocks = blocks.map(b => {
          if (b.id === dragState.blockId) {
            return { ...b, x: newX, y: newY };
          }
          if (descendants.find(d => d.id === b.id)) {
            return { 
              ...b, 
              x: Math.max(0, b.x + moveX), 
              y: Math.max(0, b.y + moveY) 
            };
          }
          return b;
        });
        
        setBlocks(newBlocks);
        setHasChanges(true);
      }
      
      if (resizeState.isResizing) {
        const deltaX = (e.clientX - resizeState.startX) / (scale / 100);
        const deltaY = (e.clientY - resizeState.startY) / (scale / 100);
        const dir = resizeState.direction;
        let newW = resizeState.startWidth;
        let newH = resizeState.startHeight;
        let newX = resizeState.startBlockX;
        let newY = resizeState.startBlockY;
        
        if (dir.includes('e')) newW = Math.max(20, resizeState.startWidth + deltaX);
        if (dir.includes('w')) {
          const widthDelta = -deltaX;
          newW = Math.max(20, resizeState.startWidth + widthDelta);
          newX = resizeState.startBlockX - widthDelta;
          if (newX < 0) { newX = 0; newW = resizeState.startBlockX + resizeState.startWidth; }
        }
        if (dir.includes('s')) newH = Math.max(20, resizeState.startHeight + deltaY);
        if (dir.includes('n')) {
          const heightDelta = -deltaY;
          newH = Math.max(20, resizeState.startHeight + heightDelta);
          newY = resizeState.startBlockY - heightDelta;
          if (newY < 0) { newY = 0; newH = resizeState.startBlockY + resizeState.startHeight; }
        }
        
        setBlocks(prev => prev.map(b => 
          b.id === resizeState.blockId 
            ? { ...b, x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) }
            : b
        ));
        setHasChanges(true);
      }
    };

    const handleMouseUp = () => {
      if (dragState.isDragging) {
        setDragState({ isDragging: false, blockId: null, startX: 0, startY: 0, startBlockX: 0, startBlockY: 0 });
        saveToHistory(blocks);
      }
      if (resizeState.isResizing) {
        setResizeState({ isResizing: false, blockId: null, direction: '', startX: 0, startY: 0, startWidth: 0, startHeight: 0, startBlockX: 0, startBlockY: 0 });
        saveToHistory(blocks);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, resizeState, blocks, scale]);

  return {
    dragState,
    resizeState,
    handleBlockDragStart,
    handleBlockResizeStart
  };
}

window.useDragResize = useDragResize;

console.log('[DND2] designer/useDragResize.js 加载完成');
