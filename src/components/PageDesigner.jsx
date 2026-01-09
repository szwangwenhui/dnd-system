// 页面设计器组件 - 第一阶段：基础框架
function PageDesigner({ projectId, roleId, page, onClose, onSave }) {
  // 区块列表
  const [blocks, setBlocks] = React.useState(page.blocks || []);
  // 选中的区块ID
  const [selectedBlockId, setSelectedBlockId] = React.useState(null);
  // 画布类型：PC (1200px) / 手机 (360px)
  const [canvasType, setCanvasType] = React.useState(page.canvasType || 'PC');
  // 画布缩放比例
  const [scale, setScale] = React.useState(100);
  // 样式面板位置
  const [panelPosition, setPanelPosition] = React.useState({ x: window.innerWidth - 320, y: 60 });
  // 样式面板是否显示
  const [showPanel, setShowPanel] = React.useState(false);
  // 是否正在拖动样式面板
  const [isDraggingPanel, setIsDraggingPanel] = React.useState(false);
  // 历史记录（用于撤销/重做）
  const [history, setHistory] = React.useState([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  // 区块列表展开状态
  const [expandedBlocks, setExpandedBlocks] = React.useState({});
  // 关闭确认弹窗
  const [showCloseModal, setShowCloseModal] = React.useState(false);
  const [closeProgress, setCloseProgress] = React.useState(page.designProgress || 0);

  // ========== 阶段1：区域数据结构 ==========
  // 区域列表
  const [areas, setAreas] = React.useState(page.design?.areas || page.areas || []);
  // 是否显示区域（高亮）
  const [showAreas, setShowAreas] = React.useState(false);
  // 是否隐藏区域内内容
  const [hideContentInAreas, setHideContentInAreas] = React.useState(false);
  // 当前设计的区域ID（null = 全局模式）
  const [currentAreaId, setCurrentAreaId] = React.useState(null);
  // 区域列表面板是否显示
  const [showAreaPanel, setShowAreaPanel] = React.useState(false);
  // 添加区域弹窗
  const [showAddAreaModal, setShowAddAreaModal] = React.useState(false);
  // 编辑区域弹窗
  const [showEditAreaModal, setShowEditAreaModal] = React.useState(false);
  const [editingArea, setEditingArea] = React.useState(null);

  // 画布尺寸配置
  const canvasConfig = {
    PC: { width: 1200, height: 800, label: 'PC端 (1200×800)' },
    Mobile: { width: 360, height: 640, label: '手机端 (360×640)' }
  };

  // 画布引用
  const canvasRef = React.useRef(null);
  // 是否有未保存的更改
  const [hasChanges, setHasChanges] = React.useState(false);

  // 初始化历史记录
  React.useEffect(() => {
    if (blocks.length > 0 || history.length === 0) {
      saveToHistory(blocks);
    }
  }, []);

  // 保存到历史记录
  const saveToHistory = (newBlocks) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newBlocks)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // 撤销
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setBlocks(JSON.parse(JSON.stringify(history[newIndex])));
      setHasChanges(true);
    }
  };

  // 重做
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setBlocks(JSON.parse(JSON.stringify(history[newIndex])));
      setHasChanges(true);
    }
  };

  // 生成区块编号
  const generateBlockId = () => {
    if (blocks.length === 0) return 'B001';
    const maxNum = blocks.reduce((max, block) => {
      const num = parseInt(block.id.substring(1));
      return num > max ? num : max;
    }, 0);
    return 'B' + (maxNum + 1).toString().padStart(3, '0');
  };

  // 添加区块
  const handleAddBlock = () => {
    const newBlock = {
      id: generateBlockId(),
      type: '显示',  // 默认类型：显示/交互/按钮
      x: 10,
      y: 10,
      width: 100,
      height: 100,
      areaId: currentAreaId,  // 关联到当前区域
      style: {
        backgroundColor: '#ffffff',
        borderColor: '#cccccc',
        borderWidth: 1,
        borderRadius: 0
      },
      createdAt: new Date().toISOString()
    };

    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    setSelectedBlockId(newBlock.id);
    setShowPanel(true);
    setHasChanges(true);
    saveToHistory(newBlocks);
  };

  // 删除区块
  const handleDeleteBlock = (blockId) => {
    // 检查是否有子区块
    const childBlocks = blocks.filter(b => b.parentId === blockId);
    const hasChildBlocks = childBlocks.length > 0;

    let confirmed = false;
    let deleteChildren = false;

    if (!hasChildBlocks) {
      // 没有子区块，直接删除
      confirmed = confirm('确定要删除该区块吗？');
    } else {
      // 有子区块，询问是否同时删除
      const message = `该区块下有 ${childBlocks.length} 个子区块。\n\n` +
                   `是否同时删除所有下级区块（包括子区块、孙区块等）？\n\n` +
                   `点击"确定"：同时删除所有下级区块\n` +
                   `点击"取消"：仅删除该区块，下级区块保留`;
      confirmed = confirm(message);
      deleteChildren = confirmed;
    }

    if (!confirmed) return;

    let newBlocks;
    if (deleteChildren) {
      // 级联删除：递归删除所有子孙区块
      const allBlockIdsToDelete = new Set([blockId]);
      const queue = [blockId];

      while (queue.length > 0) {
        const currentId = queue.shift();
        // 查找当前区块的子区块
        const children = blocks.filter(b => b.parentId === currentId);
        children.forEach(child => {
          if (!allBlockIdsToDelete.has(child.id)) {
            allBlockIdsToDelete.add(child.id);
            queue.push(child.id);
          }
        });
      }

      console.log('[PageDesigner] 级联删除区块，总计删除:', allBlockIdsToDelete.size, '个');
      newBlocks = blocks.filter(b => !allBlockIdsToDelete.has(b.id));
    } else {
      // 仅删除当前区块，保留子区块
      console.log('[PageDesigner] 仅删除区块:', blockId, '，保留子区块');
      newBlocks = blocks.filter(b => b.id !== blockId);
    }

    setBlocks(newBlocks);
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
      setShowPanel(false);
    }
    setHasChanges(true);
    saveToHistory(newBlocks);
  };

  // 选中区块
  const handleSelectBlock = (blockId) => {
    setSelectedBlockId(blockId);
    setShowPanel(true);
  };

  // 更新区块属性
  const updateBlock = (blockId, updates) => {
    const newBlocks = blocks.map(b => 
      b.id === blockId ? { ...b, ...updates } : b
    );
    setBlocks(newBlocks);
    setHasChanges(true);
  };

  // 更新区块并保存历史
  const updateBlockWithHistory = (blockId, updates) => {
    const newBlocks = blocks.map(b => 
      b.id === blockId ? { ...b, ...updates } : b
    );
    setBlocks(newBlocks);
    setHasChanges(true);
    saveToHistory(newBlocks);
  };

  // 获取选中的区块
  const getSelectedBlock = () => {
    return blocks.find(b => b.id === selectedBlockId);
  };

  // 切换区块列表展开
  const toggleBlockExpand = (blockId) => {
    setExpandedBlocks(prev => ({
      ...prev,
      [blockId]: !prev[blockId]
    }));
  };

  // ========== 阶段1：区域管理函数 ==========

  // 生成区域ID
  const generateAreaId = () => {
    if (areas.length === 0) return `AREA-${page.id}-001`;
    const maxNum = areas.reduce((max, area) => {
      const num = parseInt(area.id.split('-').pop());
      return num > max ? num : max;
    }, 0);
    return `AREA-${page.id}-${(maxNum + 1).toString().padStart(3, '0')}`;
  };

  // 检测两个区域是否重叠
  const isAreaOverlap = (area1, area2) => {
    return !(area1.x + area1.width <= area2.x ||
             area2.x + area2.width <= area1.x ||
             area1.y + area1.height <= area2.y ||
             area2.y + area2.height <= area1.y);
  };

  // 检测区域是否与其他区域重叠
  const isAreaOverlapping = (testArea, excludeAreaId = null) => {
    return areas.some(area =>
      area.id !== excludeAreaId && isAreaOverlap(testArea, area)
    );
  };

  // 添加区域
  const handleAddArea = () => {
    const newArea = {
      id: generateAreaId(),
      name: '',
      x: 0,
      y: 0,
      width: 300,
      height: 300,
      createdAt: new Date().toISOString()
    };
    setEditingArea(newArea);
    setShowAddAreaModal(true);
  };

  // 确认添加区域
  const confirmAddArea = () => {
    if (!editingArea.name.trim()) {
      alert('请输入区域名称');
      return;
    }
    if (editingArea.name.length > 10) {
      alert('区域名称不能超过10个汉字');
      return;
    }

    // 检测重叠
    if (isAreaOverlapping(editingArea)) {
      alert('区域不能与其他区域重叠');
      return;
    }

    const newAreas = [...areas, { ...editingArea }];
    setAreas(newAreas);
    setShowAddAreaModal(false);
    setEditingArea(null);
    setHasChanges(true);
  };

  // 编辑区域
  const handleEditArea = (areaId) => {
    const area = areas.find(a => a.id === areaId);
    if (area) {
      setEditingArea({ ...area });
      setShowEditAreaModal(true);
    }
  };

  // 确认编辑区域
  const confirmEditArea = () => {
    if (!editingArea.name.trim()) {
      alert('请输入区域名称');
      return;
    }
    if (editingArea.name.length > 10) {
      alert('区域名称不能超过10个汉字');
      return;
    }

    // 如果修改了位置或尺寸，检测重叠
    const oldArea = areas.find(a => a.id === editingArea.id);
    const positionChanged = oldArea.x !== editingArea.x || oldArea.y !== editingArea.y ||
                          oldArea.width !== editingArea.width || oldArea.height !== editingArea.height;
    if (positionChanged && isAreaOverlapping(editingArea, editingArea.id)) {
      alert('区域不能与其他区域重叠');
      return;
    }

    const newAreas = areas.map(a =>
      a.id === editingArea.id ? { ...editingArea } : a
    );
    setAreas(newAreas);
    setShowEditAreaModal(false);
    setEditingArea(null);
    setHasChanges(true);
  };

  // 删除区域
  const handleDeleteArea = (areaId) => {
    const area = areas.find(a => a.id === areaId);
    if (!area) return;

    const blockCount = blocks.filter(b => b.areaId === areaId).length;
    if (!confirm(`确定要删除区域"${area.name}"吗？\n该区域内有 ${blockCount} 个区块，删除区域将同时删除这些区块。`)) {
      return;
    }

    // 删除区域和其所属的区块
    const newAreas = areas.filter(a => a.id !== areaId);
    const newBlocks = blocks.filter(b => b.areaId !== areaId);

    setAreas(newAreas);
    setBlocks(newBlocks);
    if (selectedBlockId && !newBlocks.find(b => b.id === selectedBlockId)) {
      setSelectedBlockId(null);
      setShowPanel(false);
    }
    setHasChanges(true);

    // 如果正在设计该区域，退出设计模式
    if (currentAreaId === areaId) {
      setCurrentAreaId(null);
    }
  };

  // 进入区域设计模式
  const handleEnterAreaDesignMode = (areaId) => {
    setCurrentAreaId(areaId);
    setShowAreaPanel(false);
  };

  // 退出区域设计模式
  const handleExitAreaDesignMode = () => {
    setCurrentAreaId(null);
  };

  // 获取当前设计的区域
  const getCurrentArea = () => {
    return areas.find(a => a.id === currentAreaId);
  };

  // 获取当前区域内的区块
  const getCurrentAreaBlocks = () => {
    if (!currentAreaId) return blocks;
    return blocks.filter(b => b.areaId === currentAreaId);
  };

  // 保存设计
  const handleSave = async () => {
    try {
      const updatedPage = {
        ...page,
        blocks: blocks,
        areas: areas,  // 阶段5：保存区域数据
        canvasType: canvasType,
        updatedAt: new Date().toISOString()
      };
      await onSave(updatedPage);
      setHasChanges(false);
      alert('保存成功！');
    } catch (error) {
      alert('保存失败：' + error.message);
    }
  };

  // 关闭设计器
  const handleClose = () => {
    if (hasChanges) {
      setShowCloseModal(true);
    } else {
      onClose();
    }
  };

  // 确认关闭
  const confirmClose = async (saveBeforeClose) => {
    try {
      if (saveBeforeClose) {
        const updatedPage = {
          ...page,
          blocks: blocks,
          areas: areas,  // 阶段5：保存区域数据
          designProgress: closeProgress,
          updatedAt: new Date().toISOString()
        };
        await onSave(updatedPage);
      } else {
        // 只更新设计进度
        const updatedPage = {
          ...page,
          designProgress: closeProgress,
          updatedAt: new Date().toISOString()
        };
        await onSave(updatedPage);
      }
      onClose();
    } catch (error) {
      alert('操作失败：' + error.message);
    }
  };

  // 区块拖拽相关
  const [dragState, setDragState] = React.useState({
    isDragging: false,
    blockId: null,
    startX: 0,
    startY: 0,
    startBlockX: 0,
    startBlockY: 0
  });

  // 区块缩放相关
  const [resizeState, setResizeState] = React.useState({
    isResizing: false,
    blockId: null,
    direction: '',
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startBlockX: 0,
    startBlockY: 0
  });

  // ========== 阶段3：区域拖拽相关 ==========
  const [areaDragState, setAreaDragState] = React.useState({
    isDragging: false,
    areaId: null,
    startX: 0,
    startY: 0,
    startAreaX: 0,
    startAreaY: 0
  });

  // ========== 阶段3：区域缩放相关 ==========
  const [areaResizeState, setAreaResizeState] = React.useState({
    isResizing: false,
    areaId: null,
    direction: '',
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startAreaX: 0,
    startAreaY: 0
  });

  // 开始拖拽区块
  const handleBlockMouseDown = (e, blockId) => {
    if (e.target.classList.contains('resize-handle')) return;
    
    e.stopPropagation();
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    setDragState({
      isDragging: true,
      blockId: blockId,
      startX: e.clientX,
      startY: e.clientY,
      startBlockX: block.x,
      startBlockY: block.y
    });
    setSelectedBlockId(blockId);
    setShowPanel(true);
  };

  // 开始缩放区块
  const handleResizeMouseDown = (e, blockId, direction) => {
    e.stopPropagation();
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    setResizeState({
      isResizing: true,
      blockId: blockId,
      direction: direction,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: block.width,
      startHeight: block.height,
      startBlockX: block.x,
      startBlockY: block.y
    });
  };

  // ========== 阶段3：开始拖拽区域 ==========
  const handleAreaMouseDown = (e, areaId) => {
    if (e.target.classList.contains('area-resize-handle')) return;

    e.stopPropagation();
    const area = areas.find(a => a.id === areaId);
    if (!area) return;

    setAreaDragState({
      isDragging: true,
      areaId: areaId,
      startX: e.clientX,
      startY: e.clientY,
      startAreaX: area.x,
      startAreaY: area.y
    });
  };

  // ========== 阶段3：开始缩放区域 ==========
  const handleAreaResizeMouseDown = (e, areaId, direction) => {
    e.stopPropagation();
    const area = areas.find(a => a.id === areaId);
    if (!area) return;

    setAreaResizeState({
      isResizing: true,
      areaId: areaId,
      direction: direction,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: area.width,
      startHeight: area.height,
      startAreaX: area.x,
      startAreaY: area.y
    });
  };

  // 鼠标移动处理
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      // 拖拽区块
      if (dragState.isDragging) {
        const deltaX = (e.clientX - dragState.startX) / (scale / 100);
        const deltaY = (e.clientY - dragState.startY) / (scale / 100);

        const block = blocks.find(b => b.id === dragState.blockId);
        let newX = Math.max(0, Math.round(dragState.startBlockX + deltaX));
        let newY = Math.max(0, Math.round(dragState.startBlockY + deltaY));

        // 阶段3：区域边界限制
        if (block.areaId) {
          const area = areas.find(a => a.id === block.areaId);
          if (area) {
            newX = Math.max(area.x, Math.min(newX, area.x + area.width - block.width));
            newY = Math.max(area.y, Math.min(newY, area.y + area.height - block.height));
          }
        }

        updateBlock(dragState.blockId, { x: newX, y: newY });
      }

      // 缩放区块
      if (resizeState.isResizing) {
        const deltaX = (e.clientX - resizeState.startX) / (scale / 100);
        const deltaY = (e.clientY - resizeState.startY) / (scale / 100);
        const dir = resizeState.direction;

        let newWidth = resizeState.startWidth;
        let newHeight = resizeState.startHeight;
        let newX = resizeState.startBlockX;
        let newY = resizeState.startBlockY;

        if (dir.includes('e')) newWidth = Math.max(20, resizeState.startWidth + deltaX);
        if (dir.includes('w')) {
          newWidth = Math.max(20, resizeState.startWidth - deltaX);
          newX = resizeState.startBlockX + (resizeState.startWidth - newWidth);
        }
        if (dir.includes('s')) newHeight = Math.max(20, resizeState.startHeight + deltaY);
        if (dir.includes('n')) {
          newHeight = Math.max(20, resizeState.startHeight - deltaY);
          newY = resizeState.startBlockY + (resizeState.startHeight - newHeight);
        }

        // 阶段3：区域边界限制
        const block = blocks.find(b => b.id === resizeState.blockId);
        if (block && block.areaId) {
          const area = areas.find(a => a.id === block.areaId);
          if (area) {
            // 确保区块不超出区域边界
            newX = Math.max(area.x, Math.min(newX, area.x + area.width - newWidth));
            newY = Math.max(area.y, Math.min(newY, area.y + area.height - newHeight));
            newWidth = Math.min(newWidth, area.x + area.width - newX);
            newHeight = Math.min(newHeight, area.y + area.height - newY);
          }
        }

        updateBlock(resizeState.blockId, {
          x: Math.max(0, Math.round(newX)),
          y: Math.max(0, Math.round(newY)),
          width: Math.round(newWidth),
          height: Math.round(newHeight)
        });
      }

      // ========== 阶段3：拖拽区域 ==========
      if (areaDragState.isDragging) {
        const deltaX = (e.clientX - areaDragState.startX) / (scale / 100);
        const deltaY = (e.clientY - areaDragState.startY) / (scale / 100);

        let newX = Math.max(0, Math.round(areaDragState.startAreaX + deltaX));
        let newY = Math.max(0, Math.round(areaDragState.startAreaY + deltaY));

        const area = areas.find(a => a.id === areaDragState.areaId);
        if (!area) return;

        // 测试新位置是否重叠
        const testArea = {
          ...area,
          x: newX,
          y: newY
        };

        if (!isAreaOverlapping(testArea, areaDragState.areaId)) {
          setAreas(areas.map(a =>
            a.id === areaDragState.areaId ? { ...a, x: newX, y: newY } : a
          ));
        }
      }

      // ========== 阶段3：缩放区域 ==========
      if (areaResizeState.isResizing) {
        const deltaX = (e.clientX - areaResizeState.startX) / (scale / 100);
        const deltaY = (e.clientY - areaResizeState.startY) / (scale / 100);
        const dir = areaResizeState.direction;

        let newWidth = areaResizeState.startWidth;
        let newHeight = areaResizeState.startHeight;
        let newX = areaResizeState.startAreaX;
        let newY = areaResizeState.startAreaY;

        if (dir.includes('e')) newWidth = Math.max(50, areaResizeState.startWidth + deltaX);
        if (dir.includes('w')) {
          newWidth = Math.max(50, areaResizeState.startWidth - deltaX);
          newX = areaResizeState.startAreaX + (areaResizeState.startWidth - newWidth);
        }
        if (dir.includes('s')) newHeight = Math.max(50, areaResizeState.startHeight + deltaY);
        if (dir.includes('n')) {
          newHeight = Math.max(50, areaResizeState.startHeight - deltaY);
          newY = areaResizeState.startAreaY + (areaResizeState.startHeight - newHeight);
        }

        newX = Math.max(0, Math.round(newX));
        newY = Math.max(0, Math.round(newY));
        newWidth = Math.round(newWidth);
        newHeight = Math.round(newHeight);

        const area = areas.find(a => a.id === areaResizeState.areaId);
        if (!area) return;

        // 测试新尺寸是否重叠
        const testArea = {
          ...area,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight
        };

        if (!isAreaOverlapping(testArea, areaResizeState.areaId)) {
          setAreas(areas.map(a =>
            a.id === areaResizeState.areaId ? { ...a, x: newX, y: newY, width: newWidth, height: newHeight } : a
          ));
        }
      }

      // 拖拽样式面板
      if (isDraggingPanel) {
        setPanelPosition({
          x: e.clientX - 150,
          y: e.clientY - 15
        });
      }
    };

    const handleMouseUp = () => {
      if (dragState.isDragging) {
        saveToHistory(blocks);
        setDragState({ ...dragState, isDragging: false });
      }
      if (resizeState.isResizing) {
        saveToHistory(blocks);
        setResizeState({ ...resizeState, isResizing: false });
      }
      // ========== 阶段3：区域拖拽结束 ==========
      if (areaDragState.isDragging) {
        setAreaDragState({ ...areaDragState, isDragging: false });
      }
      // ========== 阶段3：区域缩放结束 ==========
      if (areaResizeState.isResizing) {
        setAreaResizeState({ ...areaResizeState, isResizing: false });
      }
      if (isDraggingPanel) {
        setIsDraggingPanel(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, resizeState, areaDragState, areaResizeState, isDraggingPanel, scale, blocks, areas, currentAreaId]);

  // 点击画布空白处取消选中
  const handleCanvasClick = (e) => {
    if (e.target === e.currentTarget || e.target.classList.contains('canvas-grid')) {
      setSelectedBlockId(null);
      setShowPanel(false);
    }
  };

  // 渲染区块
  const renderBlock = (block) => {
    const isSelected = selectedBlockId === block.id;
    const scaledStyle = {
      left: block.x * (scale / 100),
      top: block.y * (scale / 100),
      width: block.width * (scale / 100),
      height: block.height * (scale / 100),
      backgroundColor: block.style?.backgroundColor || '#ffffff',
      borderColor: block.style?.borderColor || '#cccccc',
      borderWidth: block.style?.borderWidth || 1,
      borderStyle: 'solid',
      borderRadius: block.style?.borderRadius || 0,
      position: 'absolute',
      cursor: 'move',
      boxSizing: 'border-box'
    };

    return (
      <div
        key={block.id}
        className={`block-item ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        style={scaledStyle}
        onMouseDown={(e) => handleBlockMouseDown(e, block.id)}
        onClick={(e) => {
          e.stopPropagation();
          handleSelectBlock(block.id);
        }}
      >
        {/* 区块标签 */}
        <div className="absolute -top-5 left-0 text-xs bg-blue-500 text-white px-1 rounded">
          {block.id}
        </div>
        
        {/* 区块内容 */}
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs select-none">
          {block.type}
        </div>

        {/* 缩放手柄 - 仅选中时显示 */}
        {isSelected && (
          <>
            <div className="resize-handle absolute -top-1 -left-1 w-3 h-3 bg-blue-500 cursor-nw-resize" 
                 onMouseDown={(e) => handleResizeMouseDown(e, block.id, 'nw')} />
            <div className="resize-handle absolute -top-1 -right-1 w-3 h-3 bg-blue-500 cursor-ne-resize"
                 onMouseDown={(e) => handleResizeMouseDown(e, block.id, 'ne')} />
            <div className="resize-handle absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 cursor-sw-resize"
                 onMouseDown={(e) => handleResizeMouseDown(e, block.id, 'sw')} />
            <div className="resize-handle absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 cursor-se-resize"
                 onMouseDown={(e) => handleResizeMouseDown(e, block.id, 'se')} />
            <div className="resize-handle absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 cursor-n-resize"
                 onMouseDown={(e) => handleResizeMouseDown(e, block.id, 'n')} />
            <div className="resize-handle absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 cursor-s-resize"
                 onMouseDown={(e) => handleResizeMouseDown(e, block.id, 's')} />
            <div className="resize-handle absolute top-1/2 -left-1 -translate-y-1/2 w-3 h-3 bg-blue-500 cursor-w-resize"
                 onMouseDown={(e) => handleResizeMouseDown(e, block.id, 'w')} />
            <div className="resize-handle absolute top-1/2 -right-1 -translate-y-1/2 w-3 h-3 bg-blue-500 cursor-e-resize"
                 onMouseDown={(e) => handleResizeMouseDown(e, block.id, 'e')} />
          </>
        )}
      </div>
    );
  };

  const selectedBlock = getSelectedBlock();

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      {/* 工具栏 */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-700">设计页面：</span>
          <span className="text-blue-600">{page.name}</span>
          <span className="text-gray-400 text-sm">({page.id})</span>
          {hasChanges && <span className="text-orange-500 text-sm">● 未保存</span>}
        </div>
        
        <div className="flex items-center space-x-3">
          {/* 阶段4：显示区域按钮 */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setShowAreas(!showAreas)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                showAreas
                  ? 'bg-white text-purple-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="显示/隐藏区域"
            >
              📍 区域
            </button>
            {showAreas && (
              <button
                onClick={() => setHideContentInAreas(!hideContentInAreas)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  hideContentInAreas
                    ? 'bg-white text-orange-600 shadow'
                    : 'bg-white text-gray-600 shadow'
                }`}
                title="隐藏/显示内容"
              >
                {hideContentInAreas ? '仅区域' : '区域+内容'}
              </button>
            )}
          </div>

          <div className="w-px h-6 bg-gray-300"></div>

          {/* 画布类型选择 */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setCanvasType('PC'); setHasChanges(true); }}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                canvasType === 'PC' 
                  ? 'bg-white text-blue-600 shadow' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              💻 PC端
            </button>
            <button
              onClick={() => { setCanvasType('Mobile'); setHasChanges(true); }}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                canvasType === 'Mobile' 
                  ? 'bg-white text-blue-600 shadow' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📱 手机端
            </button>
          </div>
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          {/* 撤销/重做 */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className={`px-3 py-1.5 rounded ${historyIndex <= 0 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
            title="撤销"
          >
            ↶ 撤销
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className={`px-3 py-1.5 rounded ${historyIndex >= history.length - 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
            title="重做"
          >
            ↷ 重做
          </button>
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          {/* 缩放 */}
          <select
            value={scale}
            onChange={(e) => setScale(parseInt(e.target.value))}
            className="px-2 py-1.5 border border-gray-300 rounded text-sm"
          >
            <option value="50">50%</option>
            <option value="75">75%</option>
            <option value="100">100%</option>
            <option value="125">125%</option>
            <option value="150">150%</option>
            <option value="200">200%</option>
          </select>
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          {/* 保存 */}
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            💾 保存
          </button>
          
          {/* 关闭 */}
          <button
            onClick={handleClose}
            className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
          >
            关闭
          </button>
        </div>
      </div>

      {/* 主体区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧 - 区域列表 + 区块列表 */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* 阶段2：区域列表切换按钮 */}
          <div className="p-2 border-b border-gray-200 flex space-x-2">
            <button
              onClick={() => setShowAreaPanel(true)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showAreaPanel ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📍 区域列表
            </button>
            <button
              onClick={() => setShowAreaPanel(false)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                !showAreaPanel ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📦 区块列表
            </button>
          </div>

          {/* 区域列表面板 */}
          {showAreaPanel ? (
            <div className="flex-1 overflow-y-auto p-2">
              {currentAreaId ? (
                // 阶段2：区域设计模式显示
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="font-medium text-purple-700 mb-2">当前设计的区域</div>
                    {(() => {
                      const currentArea = getCurrentArea();
                      return currentArea ? (
                        <>
                          <div className="text-sm text-gray-600">
                            <strong>区域编号：</strong>{currentArea.id}
                          </div>
                          <div className="text-sm text-gray-600">
                            <strong>区域名称：</strong>{currentArea.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            <strong>几何数据：</strong>({currentArea.x}, {currentArea.y}) {currentArea.width}*{currentArea.height}
                          </div>
                        </>
                      ) : null;
                    })()}
                  </div>
                  <button
                    onClick={handleExitAreaDesignMode}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    ← 退出区域设计模式
                  </button>
                </div>
              ) : (
                // 正常模式：显示所有区域
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700">区域列表</span>
                    <button
                      onClick={handleAddArea}
                      className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                    >
                      + 添加新区域
                    </button>
                  </div>

                  {areas.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-8">
                      暂无区域<br/>点击上方按钮添加
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">区域编号</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">区域名称</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">几何数据</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {areas.map(area => (
                            <tr key={area.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-mono">{area.id}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{area.name}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                                ({area.x}, {area.y}) {area.width}*{area.height}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-center space-x-1">
                                <button
                                  onClick={() => handleEditArea(area.id)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="修改"
                                >
                                  修改
                                </button>
                                <button
                                  onClick={() => handleEnterAreaDesignMode(area.id)}
                                  className="text-purple-600 hover:text-purple-900"
                                  title="设计区域"
                                >
                                  设计
                                </button>
                                <button
                                  onClick={() => handleDeleteArea(area.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="删除"
                                >
                                  删除
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            // 区块列表面板
            <>
              <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                <span className="font-medium text-gray-700">
                  {currentAreaId ? `区块列表 (${getCurrentArea()?.name})` : '区块列表'}
                </span>
                {currentAreaId && (
                  <button
                    onClick={handleExitAreaDesignMode}
                    className="text-xs text-purple-600 hover:text-purple-900"
                  >
                    退出
                  </button>
                )}
                <button
                  onClick={handleAddBlock}
                  className="w-8 h-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 flex items-center justify-center text-xl"
                  title="添加区块"
                >
                  +
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
            {getCurrentAreaBlocks().length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-4">
                暂无区块<br/>点击上方 + 添加
              </div>
            ) : (
              <div className="space-y-1">
                {getCurrentAreaBlocks().map(block => (
                  <div key={block.id} className="border border-gray-200 rounded">
                    <div
                      className={`flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-gray-50 ${
                        selectedBlockId === block.id ? 'bg-blue-50 border-blue-300' : ''
                      }`}
                      onClick={() => handleSelectBlock(block.id)}
                    >
                      <span className={`font-mono text-sm ${
                        selectedBlockId === block.id ? 'text-blue-600 font-semibold' : 'text-gray-700'
                      }`}>
                        {block.id}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBlockExpand(block.id);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {expandedBlocks[block.id] ? '▲' : '▼'}
                      </button>
                    </div>
                    
                    {/* 展开信息 */}
                    {expandedBlocks[block.id] && (
                      <div className="px-2 py-2 bg-gray-50 border-t border-gray-200 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-500">类型：</span>
                          <span className={`px-1.5 py-0.5 rounded text-white ${
                            block.type === '显示' ? 'bg-green-500' :
                            block.type === '交互' ? 'bg-blue-500' : 'bg-orange-500'
                          }`}>
                            {block.type}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteBlock(block.id)}
                          className="w-full mt-2 px-2 py-1 text-red-600 border border-red-300 rounded hover:bg-red-50 text-xs"
                        >
                          删除区块
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          </>
        )}
        </div>

        {/* 中间 - 画布区域 */}
        <div className="flex-1 overflow-auto bg-gray-200 p-4" onClick={handleCanvasClick}>
          {/* 画布尺寸提示 */}
          <div className="text-center text-sm text-gray-500 mb-2">
            {canvasConfig[canvasType].label}
          </div>
          <div
            ref={canvasRef}
            className="canvas-grid relative bg-white shadow-lg"
            style={{
              width: canvasConfig[canvasType].width * (scale / 100),
              height: canvasConfig[canvasType].height * (scale / 100),
              backgroundImage: 'linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, transparent 1px)',
              backgroundSize: `${10 * (scale / 100)}px ${10 * (scale / 100)}px`,
              margin: '0 auto'
            }}
            onClick={handleCanvasClick}
          >
            {/* 阶段4：渲染区域（仅在显示区域模式下）*/}
            {showAreas && !currentAreaId && areas.map(area => (
              <div
                key={area.id}
                className="absolute border-2 border-dashed bg-gray-200 cursor-move"
                style={{
                  left: area.x * (scale / 100),
                  top: area.y * (scale / 100),
                  width: area.width * (scale / 100),
                  height: area.height * (scale / 100),
                  opacity: 0.3,
                  zIndex: 0,
                  borderColor: '#9ca3af'
                }}
                onMouseDown={(e) => handleAreaMouseDown(e, area.id)}
              >
                {/* 区域标签 */}
                <div className="absolute -top-4 left-0 text-xs bg-gray-700 text-white px-1 rounded whitespace-nowrap">
                  {area.name} ({area.id})
                </div>

                {/* 区域缩放手柄 */}
                <div className="area-resize-handle absolute -top-1 -left-1 w-3 h-3 bg-purple-500 cursor-nw-resize"
                     onMouseDown={(e) => handleAreaResizeMouseDown(e, area.id, 'nw')} />
                <div className="area-resize-handle absolute -top-1 -right-1 w-3 h-3 bg-purple-500 cursor-ne-resize"
                     onMouseDown={(e) => handleAreaResizeMouseDown(e, area.id, 'ne')} />
                <div className="area-resize-handle absolute -bottom-1 -left-1 w-3 h-3 bg-purple-500 cursor-sw-resize"
                     onMouseDown={(e) => handleAreaResizeMouseDown(e, area.id, 'sw')} />
                <div className="area-resize-handle absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 cursor-se-resize"
                     onMouseDown={(e) => handleAreaResizeMouseDown(e, area.id, 'se')} />
              </div>
            ))}

            {/* 渲染区块 */}
            {!hideContentInAreas && getCurrentAreaBlocks().map(block => renderBlock(block))}
          </div>
        </div>
      </div>

      {/* 样式面板 - 浮动 */}
      {showPanel && selectedBlock && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 w-72 z-50 flex flex-col"
          style={{
            left: panelPosition.x,
            top: panelPosition.y,
            bottom: 20,
            maxHeight: 'calc(100vh - 80px)',
          }}
        >
          {/* 面板标题栏 - 可拖动 */}
          <div
            className="px-4 py-2 bg-gray-100 rounded-t-lg cursor-move flex items-center justify-between border-b border-gray-200 flex-shrink-0"
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDraggingPanel(true);
            }}
          >
            <span className="font-medium text-gray-700">样式面板 - {selectedBlock.id}</span>
            <button
              onClick={() => setShowPanel(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          {/* 面板内容 - 可滚动 */}
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            {/* 区块类型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">区块类型</label>
              <select
                value={selectedBlock.type}
                onChange={(e) => updateBlockWithHistory(selectedBlock.id, { type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="显示">显示</option>
                <option value="交互">交互</option>
                <option value="按钮">按钮</option>
              </select>
            </div>
            
            {/* 位置 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">位置 (px)</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-gray-500">X</span>
                  <input
                    type="number"
                    value={selectedBlock.x}
                    onChange={(e) => updateBlockWithHistory(selectedBlock.id, { x: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray-500">Y</span>
                  <input
                    type="number"
                    value={selectedBlock.y}
                    onChange={(e) => updateBlockWithHistory(selectedBlock.id, { y: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* 尺寸 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">尺寸 (px)</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-gray-500">宽度</span>
                  <input
                    type="number"
                    value={selectedBlock.width}
                    onChange={(e) => updateBlockWithHistory(selectedBlock.id, { width: Math.max(20, parseInt(e.target.value) || 20) })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray-500">高度</span>
                  <input
                    type="number"
                    value={selectedBlock.height}
                    onChange={(e) => updateBlockWithHistory(selectedBlock.id, { height: Math.max(20, parseInt(e.target.value) || 20) })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* 背景颜色 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">背景颜色</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={selectedBlock.style?.backgroundColor || '#ffffff'}
                  onChange={(e) => updateBlockWithHistory(selectedBlock.id, { 
                    style: { ...selectedBlock.style, backgroundColor: e.target.value }
                  })}
                  className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedBlock.style?.backgroundColor || '#ffffff'}
                  onChange={(e) => updateBlockWithHistory(selectedBlock.id, { 
                    style: { ...selectedBlock.style, backgroundColor: e.target.value }
                  })}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                />
              </div>
            </div>
            
            {/* 边框 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">边框</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-gray-500">颜色</span>
                  <input
                    type="color"
                    value={selectedBlock.style?.borderColor || '#cccccc'}
                    onChange={(e) => updateBlockWithHistory(selectedBlock.id, { 
                      style: { ...selectedBlock.style, borderColor: e.target.value }
                    })}
                    className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray-500">宽度</span>
                  <input
                    type="number"
                    value={selectedBlock.style?.borderWidth || 1}
                    min="0"
                    max="10"
                    onChange={(e) => updateBlockWithHistory(selectedBlock.id, { 
                      style: { ...selectedBlock.style, borderWidth: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* 圆角 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">圆角 (px)</label>
              <input
                type="number"
                value={selectedBlock.style?.borderRadius || 0}
                min="0"
                onChange={(e) => updateBlockWithHistory(selectedBlock.id, { 
                  style: { ...selectedBlock.style, borderRadius: parseInt(e.target.value) || 0 }
                })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* 阶段2：添加区域弹窗 */}
      {showAddAreaModal && editingArea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-lg shadow-xl w-96 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">添加新区域</h3>

            <div className="space-y-4">
              {/* 区域名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  区域名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingArea.name}
                  onChange={(e) => setEditingArea({ ...editingArea, name: e.target.value.slice(0, 10) })}
                  placeholder="10个汉字以内"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  maxLength={10}
                />
              </div>

              {/* 几何数据 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  几何数据 (X, Y, 宽×高)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <span className="text-xs text-gray-500">X</span>
                    <input
                      type="number"
                      value={editingArea.x}
                      onChange={(e) => setEditingArea({ ...editingArea, x: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Y</span>
                    <input
                      type="number"
                      value={editingArea.y}
                      onChange={(e) => setEditingArea({ ...editingArea, y: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">宽</span>
                    <input
                      type="number"
                      value={editingArea.width}
                      onChange={(e) => setEditingArea({ ...editingArea, width: Math.max(50, parseInt(e.target.value) || 50) })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      min="50"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">高</span>
                    <input
                      type="number"
                      value={editingArea.height}
                      onChange={(e) => setEditingArea({ ...editingArea, height: Math.max(50, parseInt(e.target.value) || 50) })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      min="50"
                    />
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                初始数据：(0, 0) 300×300，区域拖拽后系统自动更新
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddAreaModal(false);
                  setEditingArea(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={confirmAddArea}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 阶段2：编辑区域弹窗 */}
      {showEditAreaModal && editingArea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-lg shadow-xl w-96 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">修改区域</h3>

            <div className="space-y-4">
              {/* 区域名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  区域名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingArea.name}
                  onChange={(e) => setEditingArea({ ...editingArea, name: e.target.value.slice(0, 10) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditAreaModal(false);
                  setEditingArea(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={confirmEditArea}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 关闭确认弹窗 */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-96 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">关闭设计页面</h3>
            
            {hasChanges && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                ⚠️ 您有未保存的更改
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                请输入当前设计进度
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={closeProgress}
                  onChange={(e) => setCloseProgress(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  min="0"
                  max="100"
                  className="w-20 px-3 py-2 border border-gray-300 rounded"
                />
                <span className="text-gray-500">%</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${closeProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              >
                取消
              </button>
              {hasChanges && (
                <button
                  onClick={() => confirmClose(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  保存并关闭
                </button>
              )}
              <button
                onClick={() => confirmClose(false)}
                className={`px-4 py-2 rounded ${hasChanges ? 'bg-gray-500 text-white hover:bg-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {hasChanges ? '不保存关闭' : '确认关闭'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.PageDesigner = PageDesigner;