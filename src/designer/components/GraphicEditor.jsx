// 图形编辑器工具栏组件
// 工具栏模式：直接在设计页画布或区块上绘图

function GraphicEditor({ isOpen, onClose, onSave, targetBlock, canvasWidth, canvasHeight }) {
  const [tool, setTool] = React.useState('brush');
  const [brushSize, setBrushSize] = React.useState(3);
  const [color, setColor] = React.useState('#000000');
  const [fillMode, setFillMode] = React.useState(false);
  const [splashStyle, setSplashStyle] = React.useState('uniform');
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [startPos, setStartPos] = React.useState({ x: 0, y: 0 });
  const [elements, setElements] = React.useState([]);
  const [history, setHistory] = React.useState([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const [contextMenu, setContextMenu] = React.useState({ show: false, x: 0, y: 0, elementId: null });
  
  const overlayCanvasRef = React.useRef(null);
  const currentElementsRef = React.useRef([]);

  // 同步elements到ref
  React.useEffect(() => {
    currentElementsRef.current = elements;
  }, [elements]);

  // 获取绘图区域
  const getDrawingArea = () => {
    if (targetBlock) {
      return { x: targetBlock.x, y: targetBlock.y, width: targetBlock.width, height: targetBlock.height };
    }
    return { x: 0, y: 0, width: canvasWidth || 1600, height: canvasHeight || 800 };
  };

  // 初始化覆盖层
  React.useEffect(() => {
    if (!isOpen) return;
    
    const designCanvas = document.querySelector('.designer-canvas-container');
    if (!designCanvas) {
      console.error('找不到设计画布容器 .designer-canvas-container');
      return;
    }

    const area = getDrawingArea();
    const overlay = document.createElement('canvas');
    overlay.id = 'graphic-editor-overlay';
    overlay.width = area.width;
    overlay.height = area.height;
    overlay.style.cssText = `
      position: absolute;
      left: ${area.x}px;
      top: ${area.y}px;
      z-index: 1000;
      cursor: crosshair;
      pointer-events: auto;
    `;
    
    const canvasContent = designCanvas.querySelector('.canvas-content');
    if (canvasContent) {
      canvasContent.style.position = 'relative';
      canvasContent.appendChild(overlay);
    } else {
      designCanvas.appendChild(overlay);
    }
    
    overlayCanvasRef.current = overlay;
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, area.width, area.height);

    // 添加事件监听
    overlay.addEventListener('mousedown', handleMouseDown);
    overlay.addEventListener('mousemove', handleMouseMove);
    overlay.addEventListener('mouseup', handleMouseUp);
    overlay.addEventListener('mouseleave', handleMouseLeave);
    overlay.addEventListener('contextmenu', handleContextMenu);

    return () => {
      overlay.removeEventListener('mousedown', handleMouseDown);
      overlay.removeEventListener('mousemove', handleMouseMove);
      overlay.removeEventListener('mouseup', handleMouseUp);
      overlay.removeEventListener('mouseleave', handleMouseLeave);
      overlay.removeEventListener('contextmenu', handleContextMenu);
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    };
  }, [isOpen, targetBlock]);

  // 保存到历史
  const saveToHistory = (newElements) => {
    const els = newElements || currentElementsRef.current;
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ elements: JSON.parse(JSON.stringify(els)) });
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  };

  // 重绘覆盖层
  const redrawOverlay = (elementsToDraw) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    (elementsToDraw || []).forEach(el => {
      ctx.save();
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = el.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      switch (el.type) {
        case 'path':
          if (el.points?.length > 1) {
            ctx.beginPath();
            ctx.moveTo(el.points[0].x, el.points[0].y);
            el.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
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
          el.fill ? ctx.fillRect(el.x, el.y, el.w, el.h) : ctx.strokeRect(el.x, el.y, el.w, el.h);
          break;
        case 'circle':
          ctx.beginPath();
          ctx.ellipse(el.cx, el.cy, el.rx, el.ry, 0, 0, Math.PI * 2);
          el.fill ? ctx.fill() : ctx.stroke();
          break;
        case 'spray':
          el.dots?.forEach(dot => {
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

  const drawSplash = (ctx, el) => {
    const { x, y, style, color, size } = el;
    ctx.fillStyle = color;
    const styles = {
      uniform: () => {
        for (let i = 0; i < 50; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * size;
          ctx.beginPath();
          ctx.arc(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, Math.random() * 5 + 1, 0, Math.PI * 2);
          ctx.fill();
        }
      },
      ink: () => {
        ctx.globalAlpha = 0.6;
        for (let i = 0; i < 30; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * size * 0.8;
          ctx.beginPath();
          ctx.arc(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, Math.random() * 15 + 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      },
      random: () => {
        for (let i = 0; i < 80; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.pow(Math.random(), 0.5) * size * 1.5;
          ctx.beginPath();
          ctx.arc(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, Math.random() * 3 + 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      },
      gradientH: () => {
        const grad = ctx.createLinearGradient(x - size, y, x + size, y);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.5, color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      },
      gradientV: () => {
        const grad = ctx.createLinearGradient(x, y - size, x, y + size);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.5, color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    (styles[style] || styles.uniform)();
  };

  const getMousePos = (e) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // 使用ref存储当前状态，避免闭包问题
  const stateRef = React.useRef({ tool, color, brushSize, fillMode, splashStyle, isDrawing, startPos });
  React.useEffect(() => {
    stateRef.current = { tool, color, brushSize, fillMode, splashStyle, isDrawing, startPos };
  }, [tool, color, brushSize, fillMode, splashStyle, isDrawing, startPos]);

  const handleMouseDown = (e) => {
    if (e.button === 2) return;
    const pos = getMousePos(e);
    const { tool, color, brushSize, splashStyle } = stateRef.current;
    
    setIsDrawing(true);
    setStartPos(pos);
    
    if (tool === 'brush' || tool === 'eraser') {
      const newEl = { id: Date.now(), type: 'path', points: [pos], color: tool === 'eraser' ? '#ffffff' : color, brushSize: tool === 'eraser' ? brushSize * 3 : brushSize };
      setElements(prev => [...prev, newEl]);
    } else if (tool === 'spray') {
      const dots = Array.from({ length: 20 }, () => {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * brushSize * 3;
        return { x: pos.x + Math.cos(angle) * dist, y: pos.y + Math.sin(angle) * dist, r: Math.random() * 2 + 0.5 };
      });
      setElements(prev => [...prev, { id: Date.now(), type: 'spray', dots, color, brushSize }]);
    } else if (tool === 'splash') {
      const newEl = { id: Date.now(), type: 'splash', x: pos.x, y: pos.y, style: splashStyle, color, size: brushSize * 10 };
      setElements(prev => {
        const newEls = [...prev, newEl];
        setTimeout(() => { redrawOverlay(newEls); saveToHistory(newEls); }, 0);
        return newEls;
      });
      setIsDrawing(false);
    }
  };

  const handleMouseMove = (e) => {
    const { tool, color, brushSize, fillMode, isDrawing, startPos } = stateRef.current;
    if (!isDrawing) return;
    
    const pos = getMousePos(e);
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (tool === 'brush' || tool === 'eraser') {
      setElements(prev => {
        const newEls = [...prev];
        const curr = newEls[newEls.length - 1];
        if (curr?.type === 'path') {
          curr.points.push(pos);
          ctx.strokeStyle = curr.color;
          ctx.lineWidth = curr.brushSize;
          ctx.lineCap = 'round';
          ctx.beginPath();
          const pts = curr.points;
          if (pts.length >= 2) {
            ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
            ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
            ctx.stroke();
          }
        }
        return newEls;
      });
    } else if (tool === 'spray') {
      setElements(prev => {
        const newEls = [...prev];
        const curr = newEls[newEls.length - 1];
        if (curr?.type === 'spray') {
          for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * brushSize * 3;
            curr.dots.push({ x: pos.x + Math.cos(angle) * dist, y: pos.y + Math.sin(angle) * dist, r: Math.random() * 2 + 0.5 });
          }
          ctx.fillStyle = color;
          curr.dots.slice(-10).forEach(dot => {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
            ctx.fill();
          });
        }
        return newEls;
      });
    } else if (['line', 'arrow', 'rect', 'circle'].includes(tool)) {
      redrawOverlay(currentElementsRef.current);
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
        fillMode ? ctx.fillRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y) : ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
      } else if (tool === 'circle') {
        const rx = Math.abs(pos.x - startPos.x) / 2;
        const ry = Math.abs(pos.y - startPos.y) / 2;
        ctx.beginPath();
        ctx.ellipse((startPos.x + pos.x) / 2, (startPos.y + pos.y) / 2, rx, ry, 0, 0, Math.PI * 2);
        fillMode ? ctx.fill() : ctx.stroke();
      }
    }
  };

  const handleMouseUp = (e) => {
    const { tool, color, brushSize, fillMode, isDrawing, startPos } = stateRef.current;
    if (!isDrawing) return;
    
    const pos = getMousePos(e);
    
    if (tool === 'line') {
      setElements(prev => [...prev, { id: Date.now(), type: 'line', startX: startPos.x, startY: startPos.y, endX: pos.x, endY: pos.y, color, brushSize }]);
    } else if (tool === 'arrow') {
      setElements(prev => [...prev, { id: Date.now(), type: 'arrow', startX: startPos.x, startY: startPos.y, endX: pos.x, endY: pos.y, color, brushSize }]);
    } else if (tool === 'rect') {
      setElements(prev => [...prev, { id: Date.now(), type: 'rect', x: Math.min(startPos.x, pos.x), y: Math.min(startPos.y, pos.y), w: Math.abs(pos.x - startPos.x), h: Math.abs(pos.y - startPos.y), color, brushSize, fill: fillMode }]);
    } else if (tool === 'circle') {
      const rx = Math.abs(pos.x - startPos.x) / 2;
      const ry = Math.abs(pos.y - startPos.y) / 2;
      setElements(prev => [...prev, { id: Date.now(), type: 'circle', cx: (startPos.x + pos.x) / 2, cy: (startPos.y + pos.y) / 2, rx, ry, color, brushSize, fill: fillMode }]);
    }
    
    setIsDrawing(false);
    setTimeout(() => saveToHistory(), 50);
  };

  const handleMouseLeave = () => setIsDrawing(false);

  const handleContextMenu = (e) => {
    e.preventDefault();
    const pos = getMousePos(e);
    const el = findElementAtPosition(pos.x, pos.y);
    if (el) setContextMenu({ show: true, x: e.clientX, y: e.clientY, elementId: el.id });
  };

  const findElementAtPosition = (x, y) => {
    for (let i = currentElementsRef.current.length - 1; i >= 0; i--) {
      const el = currentElementsRef.current[i];
      const tol = Math.max(10, el.brushSize || 5);
      if (el.type === 'path' && el.points?.some(p => Math.abs(p.x - x) < tol && Math.abs(p.y - y) < tol)) return el;
      if ((el.type === 'line' || el.type === 'arrow') && pointToLineDist(x, y, el.startX, el.startY, el.endX, el.endY) < tol) return el;
      if (el.type === 'rect' && x >= el.x - tol && x <= el.x + el.w + tol && y >= el.y - tol && y <= el.y + el.h + tol) return el;
      if (el.type === 'circle' && Math.abs(x - el.cx) <= el.rx + tol && Math.abs(y - el.cy) <= el.ry + tol) return el;
      if (el.type === 'splash' && Math.abs(el.x - x) < el.size && Math.abs(el.y - y) < el.size) return el;
    }
    return null;
  };

  const pointToLineDist = (px, py, x1, y1, x2, y2) => {
    const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
    const dot = A * C + B * D, lenSq = C * C + D * D;
    const param = lenSq ? dot / lenSq : -1;
    const xx = param < 0 ? x1 : param > 1 ? x2 : x1 + param * C;
    const yy = param < 0 ? y1 : param > 1 ? y2 : y1 + param * D;
    return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2);
  };

  const deleteElement = (id) => {
    const newEls = elements.filter(el => el.id !== id);
    setElements(newEls);
    setContextMenu({ show: false, x: 0, y: 0, elementId: null });
    redrawOverlay(newEls);
    saveToHistory(newEls);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      const els = history[newIdx]?.elements || [];
      setElements(els);
      redrawOverlay(els);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      const els = history[newIdx]?.elements || [];
      setElements(els);
      redrawOverlay(els);
    }
  };

  const handleClear = () => {
    if (!confirm('确定要清空所有绘制内容吗？')) return;
    setElements([]);
    const canvas = overlayCanvasRef.current;
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    saveToHistory([]);
  };

  const handleSave = () => {
    const canvas = overlayCanvasRef.current;
    if (canvas) onSave?.(canvas.toDataURL('image/png'), elements);
    onClose?.();
  };

  React.useEffect(() => {
    const onClick = () => setContextMenu({ show: false, x: 0, y: 0, elementId: null });
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  if (!isOpen) return null;

  const tools = [
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

  return (
    <>
      {/* 工具栏 */}
      <div className="fixed left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 rounded-lg shadow-lg z-[250] flex items-center gap-2 px-3 py-2" style={{ top: '56px' }}>
        <span className="text-sm font-medium text-gray-700 mr-2">🎨 {targetBlock ? `区块: ${targetBlock.name || targetBlock.id}` : '画布装饰'}</span>
        <div className="w-px h-6 bg-gray-300" />
        
        {tools.map(t => (
          <button key={t.id} onClick={() => setTool(t.id)} className={`w-8 h-8 flex items-center justify-center rounded ${tool === t.id ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`} title={t.label}>{t.icon}</button>
        ))}
        
        <div className="w-px h-6 bg-gray-300" />
        <select value={brushSize} onChange={e => setBrushSize(+e.target.value)} className="px-1 py-0.5 border rounded text-xs w-14">
          {[1,2,3,5,8,12,20].map(s => <option key={s} value={s}>{s}px</option>)}
        </select>
        <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border" />
        
        {(tool === 'rect' || tool === 'circle') && <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={fillMode} onChange={e => setFillMode(e.target.checked)} className="w-3 h-3" />填充</label>}
        {tool === 'splash' && <select value={splashStyle} onChange={e => setSplashStyle(e.target.value)} className="px-1 py-0.5 border rounded text-xs">{splashStyles.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select>}
        
        <div className="w-px h-6 bg-gray-300" />
        <button onClick={handleUndo} disabled={historyIndex <= 0} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50" title="撤销">↶</button>
        <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50" title="重做">↷</button>
        <button onClick={handleClear} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 text-red-600" title="清空">🗑️</button>
        <div className="w-px h-6 bg-gray-300" />
        <button onClick={handleSave} className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">✓ 保存</button>
        <button onClick={onClose} className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300">✕ 取消</button>
      </div>

      {contextMenu.show && (
        <div className="fixed bg-white border rounded shadow-lg py-1 z-[400]" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button onClick={() => deleteElement(contextMenu.elementId)} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600">🗑️ 删除此元素</button>
        </div>
      )}
    </>
  );
}

window.GraphicEditor = GraphicEditor;
console.log('[DND2] GraphicEditor.jsx 加载完成 - 工具栏模式');
