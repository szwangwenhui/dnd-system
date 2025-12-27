// 图形编辑器组件
// 支持绑制直线、箭头、矩形、圆形、自由绘画、喷绘、泼墨等

function GraphicEditor({ isOpen, onClose, onSave, targetBlock, canvasWidth, canvasHeight }) {
  const canvasRef = React.useRef(null);
  const [tool, setTool] = React.useState('brush'); // brush, line, arrow, rect, circle, spray, eraser, select
  const [brushSize, setBrushSize] = React.useState(3);
  const [color, setColor] = React.useState('#000000');
  const [fillMode, setFillMode] = React.useState(false); // 填充模式
  const [splashStyle, setSplashStyle] = React.useState('uniform'); // 泼墨风格
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [startPos, setStartPos] = React.useState({ x: 0, y: 0 });
  const [history, setHistory] = React.useState([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const [elements, setElements] = React.useState([]); // 存储所有绑制的元素
  const [selectedElement, setSelectedElement] = React.useState(null);
  const [contextMenu, setContextMenu] = React.useState({ show: false, x: 0, y: 0, elementId: null });

  // 画布尺寸
  const width = targetBlock ? targetBlock.width : (canvasWidth || 1600);
  const height = targetBlock ? targetBlock.height : (canvasHeight || 800);

  // 初始化画布
  React.useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    saveToHistory();
  }, [isOpen, width, height]);

  // 保存到历史记录
  const saveToHistory = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ imageData, elements: [...elements] });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // 重绘所有元素
  const redrawCanvas = (ctx, elementsToDraw) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    elementsToDraw.forEach(el => {
      ctx.save();
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = el.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      switch (el.type) {
        case 'path':
          if (el.points && el.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(el.points[0].x, el.points[0].y);
            for (let i = 1; i < el.points.length; i++) {
              ctx.lineTo(el.points[i].x, el.points[i].y);
            }
            ctx.stroke();
          }
          break;
        case 'line':
          ctx.beginPath();
          ctx.moveTo(el.startX, el.startY);
          ctx.lineTo(el.endX, el.endY);
          ctx.stroke();
          break;
        case 'arrow':
          drawArrow(ctx, el.startX, el.startY, el.endX, el.endY, el.brushSize);
          break;
        case 'rect':
          if (el.fill) {
            ctx.fillRect(el.x, el.y, el.w, el.h);
          } else {
            ctx.strokeRect(el.x, el.y, el.w, el.h);
          }
          break;
        case 'circle':
          ctx.beginPath();
          ctx.ellipse(el.cx, el.cy, el.rx, el.ry, 0, 0, Math.PI * 2);
          if (el.fill) {
            ctx.fill();
          } else {
            ctx.stroke();
          }
          break;
        case 'spray':
          el.dots.forEach(dot => {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
            ctx.fill();
          });
          break;
        case 'splash':
          drawSplash(ctx, el);
          break;
      }
      ctx.restore();
    });
  };

  // 绘制箭头
  const drawArrow = (ctx, fromX, fromY, toX, toY, lineWidth) => {
    const headLength = Math.max(10, lineWidth * 3);
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  };

  // 绘制泼墨效果
  const drawSplash = (ctx, el) => {
    const { x, y, style, color, size } = el;
    ctx.fillStyle = color;
    
    switch (style) {
      case 'uniform': // 整体均匀
        for (let i = 0; i < 50; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * size;
          const dotX = x + Math.cos(angle) * distance;
          const dotY = y + Math.sin(angle) * distance;
          const dotSize = Math.random() * 5 + 1;
          ctx.beginPath();
          ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'ink': // 水墨风格
        ctx.globalAlpha = 0.6;
        for (let i = 0; i < 30; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * size * 0.8;
          const dotX = x + Math.cos(angle) * distance;
          const dotY = y + Math.sin(angle) * distance;
          const dotSize = Math.random() * 15 + 5;
          ctx.beginPath();
          ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        break;
      case 'random': // 随机飞溅
        for (let i = 0; i < 80; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.pow(Math.random(), 0.5) * size * 1.5;
          const dotX = x + Math.cos(angle) * distance;
          const dotY = y + Math.sin(angle) * distance;
          const dotSize = Math.random() * 3 + 0.5;
          ctx.beginPath();
          ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'gradientH': // 左右渐变
        const gradH = ctx.createLinearGradient(x - size, y, x + size, y);
        gradH.addColorStop(0, 'transparent');
        gradH.addColorStop(0.5, color);
        gradH.addColorStop(1, 'transparent');
        ctx.fillStyle = gradH;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'gradientV': // 上下渐变
        const gradV = ctx.createLinearGradient(x, y - size, x, y + size);
        gradV.addColorStop(0, 'transparent');
        gradV.addColorStop(0.5, color);
        gradV.addColorStop(1, 'transparent');
        ctx.fillStyle = gradV;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
  };

  // 获取鼠标在画布上的位置
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // 鼠标按下
  const handleMouseDown = (e) => {
    if (e.button === 2) return; // 右键不处理
    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPos(pos);
    
    if (tool === 'brush' || tool === 'eraser') {
      const newElement = {
        id: Date.now(),
        type: 'path',
        points: [pos],
        color: tool === 'eraser' ? '#ffffff' : color,
        brushSize: tool === 'eraser' ? brushSize * 3 : brushSize
      };
      setElements([...elements, newElement]);
    } else if (tool === 'spray') {
      const dots = [];
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * brushSize * 3;
        dots.push({
          x: pos.x + Math.cos(angle) * distance,
          y: pos.y + Math.sin(angle) * distance,
          r: Math.random() * 2 + 0.5
        });
      }
      const newElement = {
        id: Date.now(),
        type: 'spray',
        dots: dots,
        color: color,
        brushSize: brushSize
      };
      setElements([...elements, newElement]);
    } else if (tool === 'splash') {
      const newElement = {
        id: Date.now(),
        type: 'splash',
        x: pos.x,
        y: pos.y,
        style: splashStyle,
        color: color,
        size: brushSize * 10
      };
      setElements([...elements, newElement]);
      // 泼墨是单次操作，立即完成
      setTimeout(() => {
        setIsDrawing(false);
        saveToHistory();
      }, 0);
    } else if (tool === 'select') {
      // 选择模式：检查是否点击了某个元素
      const clickedElement = findElementAtPosition(pos.x, pos.y);
      setSelectedElement(clickedElement);
    }
  };

  // 鼠标移动
  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const pos = getMousePos(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (tool === 'brush' || tool === 'eraser') {
      // 更新当前路径
      const newElements = [...elements];
      const currentPath = newElements[newElements.length - 1];
      if (currentPath && currentPath.type === 'path') {
        currentPath.points.push(pos);
        setElements(newElements);
        
        // 实时绘制
        ctx.strokeStyle = currentPath.color;
        ctx.lineWidth = currentPath.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        const points = currentPath.points;
        if (points.length >= 2) {
          ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.stroke();
        }
      }
    } else if (tool === 'spray') {
      // 喷绘持续添加点
      const newElements = [...elements];
      const currentSpray = newElements[newElements.length - 1];
      if (currentSpray && currentSpray.type === 'spray') {
        for (let i = 0; i < 10; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * brushSize * 3;
          currentSpray.dots.push({
            x: pos.x + Math.cos(angle) * distance,
            y: pos.y + Math.sin(angle) * distance,
            r: Math.random() * 2 + 0.5
          });
        }
        setElements(newElements);
        
        // 实时绘制新点
        ctx.fillStyle = color;
        currentSpray.dots.slice(-10).forEach(dot => {
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    } else if (tool === 'line' || tool === 'arrow' || tool === 'rect' || tool === 'circle') {
      // 预览绘制
      redrawCanvas(ctx, elements);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      
      if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else if (tool === 'arrow') {
        drawArrow(ctx, startPos.x, startPos.y, pos.x, pos.y, brushSize);
      } else if (tool === 'rect') {
        const w = pos.x - startPos.x;
        const h = pos.y - startPos.y;
        if (fillMode) {
          ctx.fillRect(startPos.x, startPos.y, w, h);
        } else {
          ctx.strokeRect(startPos.x, startPos.y, w, h);
        }
      } else if (tool === 'circle') {
        const rx = Math.abs(pos.x - startPos.x);
        const ry = Math.abs(pos.y - startPos.y);
        const cx = (startPos.x + pos.x) / 2;
        const cy = (startPos.y + pos.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx / 2, ry / 2, 0, 0, Math.PI * 2);
        if (fillMode) {
          ctx.fill();
        } else {
          ctx.stroke();
        }
      }
    }
  };

  // 鼠标释放
  const handleMouseUp = (e) => {
    if (!isDrawing) return;
    const pos = getMousePos(e);
    
    if (tool === 'line') {
      const newElement = {
        id: Date.now(),
        type: 'line',
        startX: startPos.x,
        startY: startPos.y,
        endX: pos.x,
        endY: pos.y,
        color: color,
        brushSize: brushSize
      };
      setElements([...elements, newElement]);
    } else if (tool === 'arrow') {
      const newElement = {
        id: Date.now(),
        type: 'arrow',
        startX: startPos.x,
        startY: startPos.y,
        endX: pos.x,
        endY: pos.y,
        color: color,
        brushSize: brushSize
      };
      setElements([...elements, newElement]);
    } else if (tool === 'rect') {
      const newElement = {
        id: Date.now(),
        type: 'rect',
        x: Math.min(startPos.x, pos.x),
        y: Math.min(startPos.y, pos.y),
        w: Math.abs(pos.x - startPos.x),
        h: Math.abs(pos.y - startPos.y),
        color: color,
        brushSize: brushSize,
        fill: fillMode
      };
      setElements([...elements, newElement]);
    } else if (tool === 'circle') {
      const rx = Math.abs(pos.x - startPos.x) / 2;
      const ry = Math.abs(pos.y - startPos.y) / 2;
      const cx = (startPos.x + pos.x) / 2;
      const cy = (startPos.y + pos.y) / 2;
      const newElement = {
        id: Date.now(),
        type: 'circle',
        cx: cx,
        cy: cy,
        rx: rx,
        ry: ry,
        color: color,
        brushSize: brushSize,
        fill: fillMode
      };
      setElements([...elements, newElement]);
    }
    
    setIsDrawing(false);
    if (tool !== 'splash') {
      saveToHistory();
    }
  };

  // 右键菜单
  const handleContextMenu = (e) => {
    e.preventDefault();
    const pos = getMousePos(e);
    const clickedElement = findElementAtPosition(pos.x, pos.y);
    if (clickedElement) {
      setContextMenu({ show: true, x: e.clientX, y: e.clientY, elementId: clickedElement.id });
    }
  };

  // 查找位置上的元素
  const findElementAtPosition = (x, y) => {
    // 从后往前查找（后绘制的在上面）
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      const tolerance = Math.max(10, el.brushSize);
      
      switch (el.type) {
        case 'path':
          for (const point of el.points) {
            if (Math.abs(point.x - x) < tolerance && Math.abs(point.y - y) < tolerance) {
              return el;
            }
          }
          break;
        case 'line':
        case 'arrow':
          // 简化：检查是否在线段附近
          const dist = pointToLineDistance(x, y, el.startX, el.startY, el.endX, el.endY);
          if (dist < tolerance) return el;
          break;
        case 'rect':
          if (x >= el.x - tolerance && x <= el.x + el.w + tolerance &&
              y >= el.y - tolerance && y <= el.y + el.h + tolerance) {
            return el;
          }
          break;
        case 'circle':
          const dx = x - el.cx;
          const dy = y - el.cy;
          if (Math.abs(dx) <= el.rx + tolerance && Math.abs(dy) <= el.ry + tolerance) {
            return el;
          }
          break;
        case 'spray':
        case 'splash':
          // 简化：检查中心点附近
          if (el.x && el.y) {
            if (Math.abs(el.x - x) < el.size && Math.abs(el.y - y) < el.size) {
              return el;
            }
          }
          break;
      }
    }
    return null;
  };

  // 点到线段的距离
  const pointToLineDistance = (px, py, x1, y1, x2, y2) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    
    return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2);
  };

  // 删除元素
  const deleteElement = (elementId) => {
    const newElements = elements.filter(el => el.id !== elementId);
    setElements(newElements);
    setContextMenu({ show: false, x: 0, y: 0, elementId: null });
    
    // 重绘画布
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    redrawCanvas(ctx, newElements);
    saveToHistory();
  };

  // 撤销
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setElements(state.elements);
      
      // 恢复画布
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = state.imageData;
    }
  };

  // 重做
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setElements(state.elements);
      
      // 恢复画布
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = state.imageData;
    }
  };

  // 清空画布
  const handleClear = () => {
    if (!confirm('确定要清空画布吗？')) return;
    setElements([]);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    saveToHistory();
  };

  // 保存
  const handleSave = () => {
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL('image/png');
    onSave && onSave(imageData, elements);
    onClose && onClose();
  };

  // 关闭右键菜单
  React.useEffect(() => {
    const handleClick = () => setContextMenu({ show: false, x: 0, y: 0, elementId: null });
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  if (!isOpen) return null;

  const tools = [
    { id: 'select', icon: '👆', label: '选择' },
    { id: 'brush', icon: '✏️', label: '画笔' },
    { id: 'line', icon: '╱', label: '直线' },
    { id: 'arrow', icon: '→', label: '箭头' },
    { id: 'rect', icon: '▢', label: '矩形' },
    { id: 'circle', icon: '○', label: '圆形' },
    { id: 'spray', icon: '💨', label: '喷绘' },
    { id: 'splash', icon: '💧', label: '泼墨' },
    { id: 'eraser', icon: '🧹', label: '橡皮擦' },
  ];

  const splashStyles = [
    { id: 'uniform', label: '整体均匀' },
    { id: 'ink', label: '水墨风格' },
    { id: 'random', label: '随机飞溅' },
    { id: 'gradientH', label: '左右渐变' },
    { id: 'gradientV', label: '上下渐变' },
  ];

  const brushSizes = [1, 2, 3, 5, 8, 12, 20];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[300]">
      <div className="bg-white rounded-lg shadow-2xl flex flex-col" style={{ width: Math.min(width + 40, window.innerWidth - 40), height: Math.min(height + 160, window.innerHeight - 40) }}>
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-lg">
          <h3 className="text-lg font-semibold text-gray-800">
            🎨 图形编辑器 {targetBlock ? `- ${targetBlock.name || targetBlock.id}` : '- 画布装饰'}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              保存
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            >
              取消
            </button>
          </div>
        </div>

        {/* 工具栏 */}
        <div className="flex items-center gap-4 px-4 py-2 border-b bg-gray-50 flex-wrap">
          {/* 工具选择 */}
          <div className="flex items-center gap-1">
            {tools.map(t => (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                className={`w-9 h-9 flex items-center justify-center rounded text-lg ${tool === t.id ? 'bg-blue-500 text-white' : 'bg-white border hover:bg-gray-100'}`}
                title={t.label}
              >
                {t.icon}
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-gray-300" />

          {/* 画笔粗细 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">粗细:</span>
            <select
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="px-2 py-1 border rounded text-sm"
            >
              {brushSizes.map(size => (
                <option key={size} value={size}>{size}px</option>
              ))}
            </select>
          </div>

          {/* 颜色选择 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">颜色:</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
            />
          </div>

          {/* 填充模式 */}
          {(tool === 'rect' || tool === 'circle') && (
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={fillMode}
                onChange={(e) => setFillMode(e.target.checked)}
              />
              填充
            </label>
          )}

          {/* 泼墨风格 */}
          {tool === 'splash' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">风格:</span>
              <select
                value={splashStyle}
                onChange={(e) => setSplashStyle(e.target.value)}
                className="px-2 py-1 border rounded text-sm"
              >
                {splashStyles.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="w-px h-8 bg-gray-300" />

          {/* 操作按钮 */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="px-3 py-1.5 bg-white border rounded text-sm hover:bg-gray-100 disabled:opacity-50"
              title="撤销"
            >
              ↶ 撤销
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="px-3 py-1.5 bg-white border rounded text-sm hover:bg-gray-100 disabled:opacity-50"
              title="重做"
            >
              ↷ 重做
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-1.5 bg-white border rounded text-sm hover:bg-gray-100 text-red-600"
              title="清空"
            >
              🗑️ 清空
            </button>
          </div>
        </div>

        {/* 画布区域 */}
        <div className="flex-1 overflow-auto p-4 bg-gray-200">
          <div className="inline-block shadow-lg">
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => setIsDrawing(false)}
              onContextMenu={handleContextMenu}
              style={{ cursor: tool === 'eraser' ? 'crosshair' : 'default' }}
              className="bg-white"
            />
          </div>
        </div>

        {/* 右键菜单 */}
        {contextMenu.show && (
          <div
            className="fixed bg-white border rounded shadow-lg py-1 z-[400]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => deleteElement(contextMenu.elementId)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600"
            >
              🗑️ 删除此元素
            </button>
          </div>
        )}

        {/* 状态栏 */}
        <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-500 rounded-b-lg">
          画布尺寸: {width} × {height} | 元素数量: {elements.length} | 提示: 右键点击元素可删除
        </div>
      </div>
    </div>
  );
}

window.GraphicEditor = GraphicEditor;
console.log('[DND2] designer/components/GraphicEditor.jsx 加载完成');
