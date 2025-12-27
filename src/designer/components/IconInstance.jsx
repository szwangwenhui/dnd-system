// Icon实例渲染组件
// 用于在设计器画布和预览页面渲染Icon

function IconInstance({
  instance,           // Icon实例数据
  icon,               // Icon定义数据
  scale = 100,        // 缩放比例
  isDesigner = true,  // 是否在设计器中
  isSelected = false, // 是否选中
  onSelect,           // 选中回调
  onDragStart,        // 拖拽开始
  onResizeStart,      // 缩放开始
  onClick,            // 点击回调（预览页面用）
  onDelete            // 删除回调
}) {
  const s = scale / 100;
  
  // 计算样式
  const style = {
    position: 'absolute',
    left: instance.x * s,
    top: instance.y * s,
    width: instance.width * s,
    height: instance.height * s,
    zIndex: instance.zIndex || 9999,  // 默认最高层
    cursor: isDesigner ? 'move' : 'pointer',
    userSelect: 'none',
  };

  // 处理点击
  const handleClick = (e) => {
    e.stopPropagation();
    if (isDesigner) {
      onSelect && onSelect(instance.id);
    } else {
      onClick && onClick(instance, icon);
    }
  };

  // 处理拖拽开始
  const handleMouseDown = (e) => {
    if (!isDesigner) return;
    if (e.target.classList.contains('icon-resize-handle')) return;
    e.stopPropagation();
    onSelect && onSelect(instance.id);
    onDragStart && onDragStart(e, instance.id);
  };

  // 右键菜单
  const handleContextMenu = (e) => {
    if (!isDesigner) return;
    e.preventDefault();
    e.stopPropagation();
    if (confirm('确定要删除这个Icon吗？')) {
      onDelete && onDelete(instance.id);
    }
  };

  if (!icon) {
    return (
      <div style={style} className="flex items-center justify-center bg-red-100 border border-red-300 rounded">
        <span className="text-red-500 text-xs">Icon已删除</span>
      </div>
    );
  }

  return (
    <div
      style={style}
      className={`icon-instance ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      title={icon.description || icon.name}
    >
      {/* Icon图片 */}
      {icon.image?.url ? (
        <img 
          src={icon.image.url} 
          alt={icon.name}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          draggable={false}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
          <span className="text-gray-400">🔘</span>
        </div>
      )}

      {/* 选中时显示缩放手柄（仅设计器） */}
      {isDesigner && isSelected && (
        <>
          <div 
            className="icon-resize-handle absolute -right-1 -bottom-1 w-3 h-3 bg-blue-500 cursor-se-resize"
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart && onResizeStart(e, instance.id, 'se');
            }}
          />
          <div 
            className="icon-resize-handle absolute -left-1 -bottom-1 w-3 h-3 bg-blue-500 cursor-sw-resize"
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart && onResizeStart(e, instance.id, 'sw');
            }}
          />
          <div 
            className="icon-resize-handle absolute -right-1 -top-1 w-3 h-3 bg-blue-500 cursor-ne-resize"
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart && onResizeStart(e, instance.id, 'ne');
            }}
          />
          <div 
            className="icon-resize-handle absolute -left-1 -top-1 w-3 h-3 bg-blue-500 cursor-nw-resize"
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart && onResizeStart(e, instance.id, 'nw');
            }}
          />
        </>
      )}
    </div>
  );
}

// 预览页面Icon点击处理
function handleIconClick(instance, icon, options = {}) {
  const { pages, projectId, roleId, onOpenPopup } = options;
  
  if (!icon || !icon.action) {
    console.warn('Icon没有配置功能');
    return;
  }

  const action = icon.action;

  switch (action.type) {
    case 'navigatePage':
      if (action.targetPageId) {
        const url = `preview.html?projectId=${projectId}&roleId=${roleId}&pageId=${action.targetPageId}`;
        window.location.href = url;
      }
      break;
    
    case 'goBack':
      window.history.back();
      break;
    
    case 'openPopup':
      if (action.targetPopupId && onOpenPopup) {
        onOpenPopup(action.targetPopupId);
      }
      break;
    
    default:
      console.warn('未知的Icon功能类型:', action.type);
  }
}

window.IconInstance = IconInstance;
window.handleIconClick = handleIconClick;
console.log('[DND2] IconInstance.jsx 加载完成');
