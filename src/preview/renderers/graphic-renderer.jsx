// 图形元素渲染器
// 负责渲染各种图形元素（路径、线条、箭头、矩形、圆形、喷洒等）

export const createGraphicRenderer = () => {
  // 渲染图形元素
  const renderGraphicElements = (elements, offsetX = 0, offsetY = 0) => {
    if (!elements || elements.length === 0) return null;

    return elements.map((el, index) => {
      switch (el.type) {
        case 'path':
          if (!el.points || el.points.length < 2) return null;
          const pathD = el.points.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${p.x + offsetX} ${p.y + offsetY}`
          ).join(' ');
          return <path key={el.id || index} d={pathD} stroke={el.color} strokeWidth={el.brushSize} fill="none" strokeLinecap="round" strokeLinejoin="round" />;

        case 'line':
          return <line key={el.id || index} x1={el.startX + offsetX} y1={el.startY + offsetY} x2={el.endX + offsetX} y2={el.endY + offsetY} stroke={el.color} strokeWidth={el.brushSize} strokeLinecap="round" />;

        case 'arrow':
          const angle = Math.atan2(el.endY - el.startY, el.endX - el.startX);
          const headLength = Math.max(10, el.brushSize * 3);
          const arrowPoints = [
            `${el.endX + offsetX},${el.endY + offsetY}`,
            `${el.endX + offsetX - headLength * Math.cos(angle - Math.PI / 6)},${el.endY + offsetY - headLength * Math.sin(angle - Math.PI / 6)}`,
            `${el.endX + offsetX - headLength * Math.cos(angle + Math.PI / 6)},${el.endY + offsetY - headLength * Math.sin(angle + Math.PI / 6)}`
          ].join(' ');
          return (
            <g key={el.id || index}>
              <line x1={el.startX + offsetX} y1={el.startY + offsetY} x2={el.endX + offsetX} y2={el.endY + offsetY} stroke={el.color} strokeWidth={el.brushSize} strokeLinecap="round" />
              <polygon points={arrowPoints} fill={el.color} />
            </g>
          );

        case 'rect':
          return el.fill
            ? <rect key={el.id || index} x={el.x + offsetX} y={el.y + offsetY} width={el.w} height={el.h} fill={el.color} />
            : <rect key={el.id || index} x={el.x + offsetX} y={el.y + offsetY} width={el.w} height={el.h} stroke={el.color} strokeWidth={el.brushSize} fill="none" />;

        case 'circle':
          return el.fill
            ? <ellipse key={el.id || index} cx={el.cx + offsetX} cy={el.cy + offsetY} rx={el.rx} ry={el.ry} fill={el.color} />
            : <ellipse key={el.id || index} cx={el.cx + offsetX} cy={el.cy + offsetY} rx={el.rx} ry={el.ry} stroke={el.color} strokeWidth={el.brushSize} fill="none" />;

        case 'spray':
          return (
            <g key={el.id || index}>
              {el.dots?.map((dot, i) => (
                <circle key={i} cx={dot.x + offsetX} cy={dot.y + offsetY} r={dot.r} fill={el.color} />
              ))}
            </g>
          );

        case 'splash':
          const splashCircles = [];
          const seed = el.id || index;
          for (let i = 0; i < 30; i++) {
            const pseudoRandom = (seed * 9301 + 49297 + i * 233) % 233280 / 233280;
            const splashAngle = pseudoRandom * Math.PI * 2;
            const distance = Math.sqrt(pseudoRandom) * el.size;
            const dotSize = pseudoRandom * 5 + 2;
            splashCircles.push(
              <circle key={i} cx={el.x + offsetX + Math.cos(splashAngle) * distance} cy={el.y + offsetY + Math.sin(splashAngle) * distance} r={dotSize} fill={el.color} opacity={el.style === 'ink' ? 0.6 : 1} />
            );
          }
          return <g key={el.id || index}>{splashCircles}</g>;

        default:
          return null;
      }
    });
  };

  return {
    renderGraphicElements
  };
};
